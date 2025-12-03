import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send, Loader2, Bot, User as UserIcon, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="h-9 w-9 rounded-full overflow-hidden mt-0.5 flex-shrink-0 border-2 border-orange-200 shadow-sm">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f50edf823231efaa8f1c55/06633f35d_Screenshot2025-11-22at124610AM.png" 
            alt="Amira"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser && "flex flex-col items-end"}`}>
        {!isUser && <p className="text-xs text-gray-500 mb-1 ml-1">Amira</p>}
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser 
            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white" 
            : "bg-white border border-gray-200"
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown 
              className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed text-gray-700">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({ children }) => <li className="my-0.5 text-gray-700">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                code: ({ inline, children }) => 
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-gray-100 text-orange-600 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-50 p-2 rounded text-xs font-mono my-2">
                      {children}
                    </code>
                  )
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      {isUser && (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
          <UserIcon className="h-4 w-4 text-orange-600" />
        </div>
      )}
    </motion.div>
  );
}

export default function SupportAgentChat({ onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let unsubscribe = null;
    
    const initConversation = async () => {
      setIsLoading(true);
      try {
        const newConversation = await base44.agents.createConversation({
          agent_name: 'support_agent',
          metadata: {
            name: 'Support Chat',
            description: 'Partner support conversation',
          }
        });
        
        setConversation(newConversation);
        
        // Subscribe to conversation updates
        unsubscribe = base44.agents.subscribeToConversation(newConversation.id, (data) => {
          setMessages(data.messages || []);
        });

        // Send initial greeting
        await base44.agents.addMessage(newConversation, {
          role: 'user',
          content: 'Hello'
        });
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        toast.error('Failed to start chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsSending(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `[Image uploaded for analysis]`,
        file_urls: [file_url],
      });
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsSending(false);
      event.target.value = null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !conversation || isSending) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageToSend
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setInputMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", duration: 0.3 }}
      className="fixed bottom-24 right-8 z-50 w-[420px] h-[650px] shadow-2xl rounded-3xl overflow-hidden"
    >
      <Card className="h-full flex flex-col border-none">
        <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white p-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-white/40 shadow-lg">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f50edf823231efaa8f1c55/06633f35d_Screenshot2025-11-22at124610AM.png" 
                    alt="Amira"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <CardTitle className="text-xl text-white font-semibold">Amira</CardTitle>
                <p className="text-xs text-orange-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                  Always here to help
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Loader2 className="w-16 h-16 animate-spin text-orange-500" />
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Starting conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {isSending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden mt-0.5 flex-shrink-0 border-2 border-orange-200 shadow-sm">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f50edf823231efaa8f1c55/06633f35d_Screenshot2025-11-22at124610AM.png" 
                      alt="Amira"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 ml-1">Amira</p>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <div className="p-5 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <Label 
              htmlFor="image-upload" 
              className="cursor-pointer group transition-transform hover:scale-110"
            >
              <div className="p-2 rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors">
                <ImageIcon className="h-5 w-5 text-gray-500 group-hover:text-orange-600 transition-colors" />
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isLoading || isSending}
              />
            </Label>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading || isSending}
              className="flex-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-full px-4 py-2.5"
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading || isSending}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full h-10 w-10 p-0 shadow-lg transition-all hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}