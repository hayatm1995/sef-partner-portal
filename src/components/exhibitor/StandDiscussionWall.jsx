import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  X,
  Download,
  Shield,
  Building2,
  User,
  Loader2,
  ChevronDown,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StandDiscussionWall({ 
  stand, 
  currentUser, 
  isAdmin = false,
  partnerInfo = null // { name, company } - only needed for admin view
}) {
  const [message, setMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [stand?.discussion_thread]);

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage) => {
      const existingThread = stand?.discussion_thread || [];
      return await base44.entities.ExhibitorStand.update(stand.id, {
        discussion_thread: [...existingThread, newMessage]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      setMessage("");
      setAttachmentFile(null);
      setAttachmentPreview(null);
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachmentFile) return;

    setUploading(true);
    try {
      let attachment_url = null;
      let attachment_name = null;

      if (attachmentFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: attachmentFile });
        attachment_url = uploadResult.file_url;
        attachment_name = attachmentFile.name;
      }

      const newMessage = {
        message: message.trim(),
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        sender_title: isAdmin ? (currentUser.admin_title || "SEF Team") : (currentUser.company_name || "Partner"),
        is_admin: isAdmin,
        attachment_url,
        attachment_name,
        created_at: new Date().toISOString()
      };

      await sendMessageMutation.mutateAsync(newMessage);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const discussionThread = stand?.discussion_thread || [];

  // Group messages by date
  const groupedMessages = discussionThread.reduce((groups, msg) => {
    const date = format(new Date(msg.created_at), 'MMMM d, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <Card className="border-2 border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Discussion Wall</CardTitle>
              <p className="text-indigo-100 text-sm">
                {isAdmin && partnerInfo ? (
                  <>Conversation with <span className="font-semibold">{partnerInfo.name}</span> {partnerInfo.company && `(${partnerInfo.company})`}</>
                ) : (
                  "Chat with the SEF team"
                )}
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            {discussionThread.length} messages
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Container */}
        <div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
          {discussionThread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <p className="font-semibold text-lg mb-1">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation below</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, messages]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const isCurrentUser = msg.sender_email === currentUser.email;
                      const isAdminMessage = msg.is_admin;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            {/* Sender Info */}
                            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isAdminMessage 
                                  ? 'bg-gradient-to-br from-orange-500 to-amber-600' 
                                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              }`}>
                                {isAdminMessage ? (
                                  <Shield className="w-3 h-3 text-white" />
                                ) : (
                                  <User className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-xs font-semibold text-gray-700">
                                {msg.sender_name}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1.5 py-0 ${
                                  isAdminMessage 
                                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {msg.sender_title}
                              </Badge>
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isCurrentUser
                                ? isAdminMessage
                                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                : isAdminMessage
                                  ? 'bg-orange-50 border-2 border-orange-200 text-gray-800'
                                  : 'bg-white border-2 border-gray-200 text-gray-800'
                            }`}>
                              {msg.message && (
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              )}

                              {/* Attachment */}
                              {msg.attachment_url && (
                                <div className="mt-2">
                                  <div 
                                    className="relative group cursor-pointer"
                                    onClick={() => setExpandedImage(msg.attachment_url)}
                                  >
                                    <img
                                      src={msg.attachment_url}
                                      alt={msg.attachment_name || "Attachment"}
                                      className="max-w-full max-h-48 rounded-lg object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <Maximize2 className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  {msg.attachment_name && (
                                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/80' : 'text-gray-500'}`}>
                                      📎 {msg.attachment_name}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <p className={`text-[10px] text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t-2 border-gray-100 p-4 bg-white">
          {/* Attachment Preview */}
          <AnimatePresence>
            {attachmentPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="relative inline-block">
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="h-20 rounded-lg object-cover border-2 border-indigo-200"
                  />
                  <button
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </Button>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="resize-none min-h-[44px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            <Button
              type="submit"
              disabled={uploading || (!message.trim() && !attachmentFile)}
              className={`flex-shrink-0 ${
                isAdmin 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
              }`}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </CardContent>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage}
                alt="Expanded"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => window.open(expandedImage, '_blank')}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setExpandedImage(null)}
                  className="bg-white/90 hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}