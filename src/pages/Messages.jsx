import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { partnerMessagesService } from "@/services/supabaseService";
import { supabase } from "@/config/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Clock, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Messages() {
  const { user, partner } = useAuth();
  const partnerId = partner?.id;
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const channelRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['partnerMessages', partnerId],
    queryFn: () => partnerMessagesService.getByPartnerId(partnerId),
    enabled: !!partnerId,
  });

  // Subscribe for realtime updates
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel(`partner_messages:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
          filter: `partner_id=eq.${partnerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [partnerId, queryClient]);

  // Mark unread messages as read
  useEffect(() => {
    if (!partnerId || !messages.length || !user?.id) return;
    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      partnerMessagesService.markAsRead(partnerId, unreadIds).catch(console.error);
      queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
    }
  }, [messages, partnerId, user?.id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!partnerId || !user?.id) throw new Error('Missing message context');
      return partnerMessagesService.create({
        partner_id: partnerId,
        sender_id: user.id,
        message: messageText,
        is_read: false,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Chat securely with the SEF admin team</p>
          </div>
          {partner?.name && (
            <Badge variant="outline" className="text-sm">
              {partner.name}
            </Badge>
          )}
        </div>

        <Card className="border-orange-100 shadow-md">
          <CardHeader className="flex items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversation
            </CardTitle>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Encrypted via Supabase channel
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-96 p-6">
                  <div className="space-y-4">
                    {sortedMessages.length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-8">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    {sortedMessages.map((msg) => {
                      const isSelf = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isSelf ? 'flex-row-reverse text-right' : 'flex-row'}`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                            {isSelf ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </div>
                          <div className="max-w-[75%]">
                            <div
                              className={`rounded-2xl px-4 py-2 text-sm shadow ${
                                isSelf
                                  ? 'bg-orange-50 border border-orange-100 text-gray-900'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.message}</p>
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSend} className="p-4 border-t bg-white">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-amber-600"
                      disabled={sendMutation.isPending || !newMessage.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}