import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { partnersService, partnerMessagesService, notificationsService } from '@/services/supabaseService';
import { supabase } from '@/config/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageSquare, Send, User, Shield, Loader2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function AdminMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const channelRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/Dashboard";
    }
  }, [user, isAdmin]);

  // Fetch all partners
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Fetch partners with unread messages
  const { data: partnersWithUnread = [] } = useQuery({
    queryKey: ['partnersWithUnread'],
    queryFn: () => partnerMessagesService.getPartnersWithUnread(),
    enabled: isAdmin,
  });

  // Fetch messages for selected partner
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['partnerMessages', selectedPartnerId],
    queryFn: () => partnerMessagesService.getByPartnerId(selectedPartnerId),
    enabled: !!selectedPartnerId && isAdmin,
  });

  // Fetch unread count for admin
  const { data: totalUnreadCount = 0 } = useQuery({
    queryKey: ['adminMessagesUnread'],
    queryFn: () => partnerMessagesService.getAdminUnreadCount(),
    enabled: isAdmin,
  });

  // Set up real-time subscription for selected partner
  React.useEffect(() => {
    if (!selectedPartnerId) return;

    const channel = supabase
      .channel(`admin_messages:${selectedPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
          filter: `partner_id=eq.${selectedPartnerId}`,
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          queryClient.invalidateQueries({ queryKey: ['partnerMessages', selectedPartnerId] });
          queryClient.invalidateQueries({ queryKey: ['partnersWithUnread'] });
          queryClient.invalidateQueries({ queryKey: ['adminMessagesUnread'] });
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
  }, [selectedPartnerId, queryClient]);

  // Mark messages as read when partner is selected
  React.useEffect(() => {
    if (selectedPartnerId && messages.length > 0) {
      const unreadIds = messages
        .filter(msg => !msg.is_read && msg.sender_id !== user?.id)
        .map(msg => msg.id);
      
      if (unreadIds.length > 0) {
        partnerMessagesService.markAsRead(selectedPartnerId, unreadIds).catch(console.error);
        queryClient.invalidateQueries({ queryKey: ['partnersWithUnread'] });
        queryClient.invalidateQueries({ queryKey: ['adminMessagesUnread'] });
      }
    }
  }, [selectedPartnerId, messages, user?.id, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ partnerId, messageText }) => {
      if (!partnerId || !user?.id) {
        throw new Error('Missing required data');
      }

      const newMessage = await partnerMessagesService.create({
        partner_id: partnerId,
        sender_id: user.id,
        message: messageText,
        is_read: false,
      });

      // Notify partner
      try {
        await notificationsService.create({
          partner_id: partnerId,
          type: 'info',
          title: 'New Message from Admin',
          message: `You have a new message from ${user?.full_name || 'Admin'}.`,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }

      return newMessage;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['partnerMessages', selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['partnersWithUnread'] });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message: ' + (error.message || 'Unknown error'));
    },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedPartnerId) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        partnerId: selectedPartnerId,
        messageText: message.trim(),
      });
    } catch (error) {
      // Error handled in mutation
    } finally {
      setSending(false);
    }
  };

  // Filter partners
  const filteredPartners = useMemo(() => {
    let filtered = allPartners;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query)
      );
    }

    // Filter by unread
    if (filterUnread) {
      const unreadPartnerIds = new Set(partnersWithUnread.map(p => p.partner_id));
      filtered = filtered.filter(p => unreadPartnerIds.has(p.id));
    }

    // Sort: partners with unread first
    const unreadPartnerIds = new Set(partnersWithUnread.map(p => p.partner_id));
    filtered.sort((a, b) => {
      const aHasUnread = unreadPartnerIds.has(a.id);
      const bHasUnread = unreadPartnerIds.has(b.id);
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [allPartners, searchQuery, filterUnread, partnersWithUnread]);

  const getUnreadCount = (partnerId) => {
    const partner = partnersWithUnread.find(p => p.partner_id === partnerId);
    return partner?.unread_count || 0;
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
  const selectedPartner = allPartners.find(p => p.id === selectedPartnerId);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'Admin', href: '/admin/partners' },
              { label: 'Partner Messages', href: '/admin/messages' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Partner Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with partners</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Partner List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Partners
                  {totalUnreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {totalUnreadCount}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search and Filter */}
              <div className="p-4 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search partners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={filterUnread ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterUnread(!filterUnread)}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filterUnread ? 'Show All' : 'Unread Only'}
                </Button>
              </div>

              {/* Partner List */}
              <ScrollArea className="h-[600px]">
                {filteredPartners.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No partners found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredPartners.map((partner) => {
                      const unreadCount = getUnreadCount(partner.id);
                      const isSelected = partner.id === selectedPartnerId;

                      return (
                        <button
                          key={partner.id}
                          onClick={() => setSelectedPartnerId(partner.id)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {partner.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {partner.tier || 'N/A'}
                              </p>
                            </div>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                {selectedPartner ? (
                  <>
                    {selectedPartner.name}
                    {getUnreadCount(selectedPartner.id) > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {getUnreadCount(selectedPartner.id)} unread
                      </Badge>
                    )}
                  </>
                ) : (
                  'Select a partner to start chatting'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedPartnerId ? (
                <div className="flex items-center justify-center h-[600px] text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a partner from the list to view messages</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages Area */}
                  <ScrollArea className="h-[500px] p-4">
                    {loadingMessages ? (
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
                                const isAdminMessage = isOwnMessage;
                                
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex gap-3 mb-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                                  >
                                    <div
                                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        isAdminMessage
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'bg-orange-100 text-orange-600'
                                      }`}
                                    >
                                      {isAdminMessage ? (
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
                                          isAdminMessage
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'bg-gray-100 text-gray-900'
                                        }`}
                                      >
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1 px-1">
                                        {formatMessageDate(msg.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

