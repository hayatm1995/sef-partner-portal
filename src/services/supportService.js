import { supabase } from '@/config/supabase';

/**
 * Support Messaging Service
 * Handles partner-admin support conversations
 */

export const supportService = {
  // Fetch all messages for a partner
  fetchMessages: async (partnerId) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Send a message
  sendMessage: async ({ partnerId, senderId, senderRole, message, file }) => {
    let fileUrl = null;

    // Upload file if provided
    if (file) {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      // Use timestamp as message_id placeholder - will be updated after message creation
      const messageIdPlaceholder = timestamp;
      const filePath = `support/${partnerId}/${messageIdPlaceholder}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
    }

    // Create message
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        partner_id: partnerId,
        sender_id: senderId,
        sender_role: senderRole,
        message: message,
        file_url: fileUrl,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to messages for real-time updates
  subscribeToMessages: (partnerId, callback) => {
    const channel = supabase
      .channel(`support_messages:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Mark all messages as read for a partner (from specific role)
  markAllAsRead: async (partnerId, role) => {
    // Mark messages from the opposite role as read
    const oppositeRole = role === 'admin' ? 'partner' : 'admin';
    
    const { error } = await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('partner_id', partnerId)
      .eq('sender_role', oppositeRole)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Get unread count for a partner
  getUnreadCount: async (partnerId, role) => {
    const oppositeRole = role === 'admin' ? 'partner' : 'admin';
    
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .eq('sender_role', oppositeRole)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Get all partners with unread messages (admin only)
  getPartnersWithUnread: async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        partner_id,
        partners (
          id,
          name
        )
      `)
      .eq('sender_role', 'partner')
      .eq('is_read', false);

    if (error) throw error;

    // Group by partner_id and count unread
    const partnerMap = {};
    data?.forEach(msg => {
      const partnerId = msg.partner_id;
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          partner_id: partnerId,
          partner: msg.partners,
          unread_count: 0
        };
      }
      partnerMap[partnerId].unread_count++;
    });

    return Object.values(partnerMap);
  },

  // Get latest message per partner (admin view)
  getLatestMessagesByPartner: async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        partners (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by partner and get latest message
    const partnerMap = {};
    data?.forEach(msg => {
      const partnerId = msg.partner_id;
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          partner_id: partnerId,
          partner: msg.partners,
          latest_message: msg,
          unread_count: 0
        };
      }
      if (msg.sender_role === 'partner' && !msg.is_read) {
        partnerMap[partnerId].unread_count++;
      }
    });

    return Object.values(partnerMap);
  }
};

