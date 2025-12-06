import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { boothDiscussionsService } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function BoothChat({ boothId }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Determine sender role
  const senderRole = user?.is_admin || user?.is_super_admin ? 'admin' : 'partner';

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['boothDiscussions', boothId],
    queryFn: () => boothDiscussionsService.getByBoothId(boothId),
    enabled: !!boothId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!boothId) return;

    // Subscribe to changes in booth_discussions table
    const channel = supabase
      .channel(`booth_discussions:${boothId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booth_discussions',
          filter: `booth_id=eq.${boothId}`,
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Invalidate and refetch messages
          queryClient.invalidateQueries({ queryKey: ['boothDiscussions', boothId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [boothId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!boothId) throw new Error('Booth ID is required');
      if (!user?.id) throw new Error('User ID is required');

      return await boothDiscussionsService.create({
        booth_id: boothId,
        sender_id: user.id,
        sender_role: senderRole,
        message: messageText,
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['boothDiscussions', boothId] });
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Booth Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea className="h-[400px] p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                const isOwnMessage = msg.sender_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
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
                        className={`rounded-lg p-3 max-w-[80%] ${
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
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
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
                'Sending...'
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
  );
}


