import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supportService } from '@/services/supportService';
import { partnersService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import MessageThread from '@/components/support/MessageThread';
import MessageInput from '@/components/support/MessageInput';
import { motion } from 'framer-motion';

export default function AdminSupport() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Fetch all partners with their latest messages
  const { data: partnersWithMessages = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['adminSupportPartners'],
    queryFn: () => supportService.getLatestMessagesByPartner(),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Fetch all partners for search (superadmin sees all, admin sees only assigned)
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners', role, user?.id],
    queryFn: () => partnersService.getAll({
      role: role || undefined,
      currentUserAuthId: user?.id || undefined,
    }),
    enabled: isAdmin,
  });

  // Fetch messages for selected partner
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['supportMessages', selectedPartnerId],
    queryFn: () => supportService.fetchMessages(selectedPartnerId),
    enabled: !!selectedPartnerId && isAdmin,
  });

  // Real-time subscription
  useEffect(() => {
    if (!selectedPartnerId) return;

    const unsubscribe = supportService.subscribeToMessages(selectedPartnerId, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['supportMessages', selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportPartners'] });
    });

    return unsubscribe;
  }, [selectedPartnerId, queryClient]);

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (selectedPartnerId && messages.length > 0) {
      supportService.markAllAsRead(selectedPartnerId, 'admin').catch(console.error);
      queryClient.invalidateQueries({ queryKey: ['adminSupportPartners'] });
    }
  }, [selectedPartnerId, messages.length, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, file }) => {
      if (!selectedPartnerId || !user?.id) {
        throw new Error('Missing partner or user information');
      }
      return supportService.sendMessage({
        partnerId: selectedPartnerId,
        senderId: user.id,
        senderRole: 'admin',
        message,
        file
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportMessages', selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['adminSupportPartners'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  // Filter partners by search
  const filteredPartners = React.useMemo(() => {
    if (!searchQuery) return partnersWithMessages;
    
    const query = searchQuery.toLowerCase();
    return partnersWithMessages.filter(p => 
      p.partner?.name?.toLowerCase().includes(query)
    );
  }, [partnersWithMessages, searchQuery]);

  // Auto-select first partner if none selected
  useEffect(() => {
    if (!selectedPartnerId && filteredPartners.length > 0) {
      setSelectedPartnerId(filteredPartners[0].partner_id);
    }
  }, [filteredPartners, selectedPartnerId]);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPartner = partnersWithMessages.find(p => p.partner_id === selectedPartnerId);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Messages</h1>
        <p className="text-gray-600">Manage partner support conversations</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Partner List Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {partnersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : filteredPartners.length > 0 ? (
              filteredPartners.map((partnerData) => {
                const isSelected = partnerData.partner_id === selectedPartnerId;
                const hasUnread = partnerData.unread_count > 0;

                return (
                  <motion.div
                    key={partnerData.partner_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <button
                      onClick={() => setSelectedPartnerId(partnerData.partner_id)}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {partnerData.partner?.name || 'Unknown Partner'}
                        </h3>
                        {hasUnread && (
                          <Badge variant="destructive" className="ml-2">
                            {partnerData.unread_count}
                          </Badge>
                        )}
                      </div>
                      {partnerData.latest_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {partnerData.latest_message.message}
                        </p>
                      )}
                      {partnerData.latest_message && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(partnerData.latest_message.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No partners found</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedPartnerId ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedPartner?.partner?.name || 'Unknown Partner'}
                </h2>
              </div>

              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                </div>
              ) : (
                <>
                  <MessageThread messages={messages} currentUserRole="admin" />
                  <MessageInput
                    onSend={({ message, file }) => sendMessageMutation.mutate({ message, file })}
                    disabled={sendMessageMutation.isPending}
                  />
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select a partner to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

