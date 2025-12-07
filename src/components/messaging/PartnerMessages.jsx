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

export default function PartnerMessages({ partnerId, deliverableId = null, onClose = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const channelRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  // Determine which query to use
  const queryKey = deliverableId 
    ? ['partnerMessages', partnerId, 'deliverable', deliverableId]
    : ['partnerMessages', partnerId];
  
  const queryFn = deliverableId
    ? () => partnerMessagesService.getByDeliverableId(deliverableId)
    : () => partnerMessagesService.getByPartnerId(partnerId);

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled: !!partnerId,
  });

  // Subscribe for realtime updates
  useEffect(() => {
    if (!partnerId) return;
    
    const channelName = deliverableId 
      ? `partner_messages:${partnerId}:deliverable:${deliverableId}`
      : `partner_messages:${partnerId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
          filter: deliverableId 
            ? `partner_id=eq.${partnerId} AND deliverable_id=eq.${deliverableId}`
            : `partner_id=eq.${partnerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
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
  }, [partnerId, deliverableId, queryClient, queryKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!partnerId || !messages.length || !user?.id) return;
    
    // Determine if message is from other party
    const unreadIds = messages
      .filter((m) => {
        if (m.is_read) return false;
        // For partners: mark admin messages as read
        // For admins: mark partner messages as read
        if (!isAdmin) {
          return m.sender_role === 'admin';
        } else {
          return m.sender_role === 'partner';
        }
      })
      .map((m) => m.id);
    
    if (unreadIds.length > 0) {
      partnerMessagesService.markAsRead(partnerId, unreadIds).catch(console.error);
      queryClient.invalidateQueries({ queryKey });
    }
  }, [messages, partnerId, user?.id, queryClient, queryKey, isAdmin]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!partnerId || !user?.id) throw new Error('Missing message context');
      
      // Determine sender_role
      let senderRole = 'partner';
      if (isAdmin) {
        senderRole = 'admin';
      } else {
        // Check if user is actually a partner
        const { data: partnerUser } = await supabase
          .from('partner_users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (partnerUser?.role && ['admin', 'sef_admin', 'superadmin'].includes(partnerUser.role)) {
          senderRole = 'admin';
        }
      }
      
      return partnerMessagesService.create({
        partner_id: partnerId,
        sender_id: user.id,
        sender_role: senderRole,
        message: messageText,
        deliverable_id: deliverableId || null,
        is_read: false,
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className={onClose ? "h-full flex flex-col" : "p-4 md:p-8 max-w-5xl mx-auto"}>
      <Card className={onClose ? "flex-1 flex flex-col border-0 shadow-none" : "border-orange-100 shadow-md"}>
        {!onClose && (
          <CardHeader className="flex items-center justify-between border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {deliverableId ? 'Deliverable Discussion' : 'Messages'}
            </CardTitle>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure messaging
            </div>
          </CardHeader>
        )}
        <CardContent className={onClose ? "flex-1 flex flex-col p-0" : "p-0"}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          ) : (
            <>
              <ScrollArea className={onClose ? "flex-1 p-4" : "h-96 p-6"}>
                <div className="space-y-4">
                  {sortedMessages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  {sortedMessages.map((msg) => {
                    const isSelf = msg.sender_id === user?.id || 
                                  (isAdmin && msg.sender_role === 'admin') ||
                                  (!isAdmin && msg.sender_role === 'partner');
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${isSelf ? 'flex-row-reverse text-right' : 'flex-row'}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                          isSelf 
                            ? 'bg-gradient-to-br from-orange-500 to-amber-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {isSelf ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[75%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm shadow ${
                              isSelf
                                ? 'bg-orange-50 border border-orange-100 text-gray-900'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.message}</p>
                          </div>
                          <div className={`text-[11px] text-gray-500 flex items-center gap-1 mt-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            {!msg.is_read && !isSelf && (
                              <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleSend} className={`${onClose ? 'p-4' : 'p-4'} border-t bg-white`}>
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
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
    </div>
  );
}

