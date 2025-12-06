import React, { useState, useRef, useEffect } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Paperclip, Shield, User, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ContractDiscussion({ contractId, user, isAdmin }) {
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contractMessages', contractId],
    queryFn: () => base44.entities.ContractMessage.filter({ contract_id: contractId }, 'created_date'),
    enabled: !!contractId
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      let attachmentData = {};
      if (attachment) {
        setUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: attachment });
        attachmentData = { attachment_url: file_url, attachment_name: attachment.name };
        setUploading(false);
      }
      
      return base44.entities.ContractMessage.create({
        contract_id: contractId,
        sender_email: user.email,
        sender_name: user.full_name,
        message: data.message,
        is_admin: isAdmin,
        ...attachmentData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractMessages', contractId] });
      setNewMessage("");
      setAttachment(null);
      toast.success("Message sent");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() && !attachment) return;
    sendMutation.mutate({ message: newMessage });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          Discussion Wall
          <Badge variant="outline" className="ml-2 bg-white">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Container */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation about this contract</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${msg.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.sender_email === user.email ? 'order-2' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.sender_email === user.email ? 'justify-end' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.is_admin 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-orange-400 to-amber-500'
                      }`}>
                        {msg.is_admin ? (
                          <Shield className="w-3 h-3 text-white" />
                        ) : (
                          <User className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {msg.sender_name || msg.sender_email}
                      </span>
                      {msg.is_admin && (
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.sender_email === user.email
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-br-md'
                        : msg.is_admin
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-bl-md'
                          : 'bg-white border-2 border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      {msg.attachment_url && (
                        <a 
                          href={msg.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 mt-2 text-xs ${
                            msg.sender_email === user.email || msg.is_admin
                              ? 'text-white/90 hover:text-white'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <Paperclip className="w-3 h-3" />
                          {msg.attachment_name || 'Attachment'}
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          {attachment && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 flex-1 truncate">{attachment.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAttachment(null)}
                className="text-blue-600 hover:text-blue-700 h-6 px-2"
              >
                Remove
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={2}
                className="resize-none pr-10 border-2 border-gray-200 focus:border-purple-400"
              />
              <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-purple-600 transition-colors">
                <Paperclip className="w-5 h-5" />
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files[0])}
                />
              </label>
            </div>
            <Button 
              onClick={handleSend}
              disabled={sendMutation.isPending || uploading || (!newMessage.trim() && !attachment)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-auto"
            >
              {sendMutation.isPending || uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}