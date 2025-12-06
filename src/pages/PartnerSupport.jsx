import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supportService } from '@/services/supportService';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';
import MessageThread from '@/components/support/MessageThread';
import MessageInput from '@/components/support/MessageInput';

export default function PartnerSupport() {
  const { user, currentPartnerId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages for current partner
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['supportMessages', currentPartnerId],
    queryFn: () => supportService.fetchMessages(currentPartnerId),
    enabled: !!currentPartnerId,
    refetchInterval: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!currentPartnerId) return;

    const unsubscribe = supportService.subscribeToMessages(currentPartnerId, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['supportMessages', currentPartnerId] });
    });

    return unsubscribe;
  }, [currentPartnerId, queryClient]);

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (currentPartnerId && messages.length > 0) {
      supportService.markAllAsRead(currentPartnerId, 'partner').catch(console.error);
    }
  }, [currentPartnerId, messages.length]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, file }) => {
      if (!currentPartnerId || !user?.id) {
        throw new Error('Missing partner or user information');
      }
      return supportService.sendMessage({
        partnerId: currentPartnerId,
        senderId: user.id,
        senderRole: 'partner',
        message,
        file
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportMessages', currentPartnerId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  if (!currentPartnerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No partner associated with your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Support</h1>
        <p className="text-gray-600">Chat with our support team</p>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            <MessageThread messages={messages} currentUserRole="partner" />
            <MessageInput
              onSend={({ message, file }) => sendMessageMutation.mutate({ message, file })}
              disabled={sendMessageMutation.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

