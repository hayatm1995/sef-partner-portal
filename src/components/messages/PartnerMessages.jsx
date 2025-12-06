import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { partnerMessagesService, notificationsService } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, User, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PartnerMessages() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user, partner } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  const partnerId = partner?.id;

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['partnerMessages', partnerId],
    queryFn: () => partnerMessagesService.getByPartnerId(partnerId),
    enabled: !!partnerId,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['partnerMessagesUnread', partnerId],
    queryFn: () => partnerMessagesService.getUnreadCount(partnerId),
    enabled: !!partnerId,
  });

  // Set up real-time subscription
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
        (payload) => {
          console.log('Real-time message update:', payload);
          queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
          queryClient.invalidateQueries({ queryKey: ['partnerMessagesUnread', partnerId] });
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (messages.length > 0 && partnerId) {
      const unreadIds = messages
        .filter(msg => !msg.is_read && msg.sender_id !== user?.id)
        .map(msg => msg.id);
      
      if (unreadIds.length > 0) {
        partnerMessagesService.markAsRead(partnerId, unreadIds).catch(console.error);
        queryClient.invalidateQueries({ queryKey: ['partnerMessagesUnread', partnerId] });
      }
    }
  }, [messages, partnerId, user?.id, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!partnerId || !user?.id) {
        throw new Error('Missing required data');
      }

      const newMessage = await partnerMessagesService.create({
        partner_id: partnerId,
        sender_id: user.id,
        message: messageText,
        is_read: false,
      });

      // Notify admins
      try {
        const { data: adminUsers } = await supabase
          .from('partner_users')
          .select('partner_id')
          .in('role', ['admin', 'sef_admin']);
        
        if (adminUsers && adminUsers.length > 0) {
          const adminPartnerIds = [...new Set(adminUsers.map(a => a.partner_id).filter(Boolean))];
          
          const notificationPromises = adminPartnerIds.map(async (adminPartnerId) => {
            await notificationsService.create({
              partner_id: adminPartnerId,
              type: 'info',
              title: 'New Message',
              message: `${user?.full_name || user?.email} sent a message.`,
            });
          });
          await Promise.all(notificationPromises);
        }
      } catch (error) {
        console.error('Failed to send notification:', error);
      }

      return newMessage;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['partnerMessages', partnerId] });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message: ' + (error.message || 'Unknown error'));
    },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } catch (error) {
      // Error handled in mutation
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (!partnerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Partner Found</h3>
            <p className="text-gray-600">Please contact support to set up your partner account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Support Chat
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Area */}
          <ScrollArea className="h-[500px] p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(messageGroups).map(([dateKey, dateMessages]) => {
                  const date = new Date(dateKey);
                  const isTodayDate = isToday(date);
                  const isYesterdayDate = isYesterday(date);
                  
                  return (
                    <div key={dateKey}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {isTodayDate ? 'Today' : isYesterdayDate ? 'Yesterday' : format(date, 'MMMM d, yyyy')}
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      {dateMessages.map((msg) => {
                        const isOwnMessage = msg.sender_id === user?.id;
                        const isAdmin = msg.sender?.email?.includes('@sef.') || 
                                       msg.sender?.email?.includes('admin');
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 mb-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                isAdmin
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}
                            >
                              {isAdmin ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div
                              className={`flex-1 min-w-0 ${
                                isOwnMessage ? 'items-end' : 'items-start'
                              } flex flex-col`}
                            >
                              <div
                                className={`rounded-lg p-3 max-w-[75%] ${
                                  isAdmin
                                    ? 'bg-blue-100 text-blue-900'
                                    : isOwnMessage
                                    ? 'bg-orange-100 text-orange-900'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 px-1">
                                {formatMessageDate(msg.created_at)}
                                {!msg.is_read && !isOwnMessage && (
                                  <span className="ml-2 text-blue-600">• Unread</span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="resize-none"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


