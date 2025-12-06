import { supabase } from '@/config/supabase';

export const vipInvitationsService = {
  // Get all invitations for a partner
  getByPartner: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select(`
        *,
        partner:partners(id, name)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get invitations for a partner filtered by event type
  getByPartnerAndEvent: async (partnerId, eventType) => {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get all invitations (admin only)
  getAll: async (filters = {}) => {
    let query = supabase
      .from('partner_invitations')
      .select(`
        *,
        partner:partners!inner(id, name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.partner_id) {
      query = query.eq('partner_id', filters.partner_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create invitation
  createInvitation: async (payload) => {
    const { data, error } = await supabase
      .from('partner_invitations')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update invitation
  updateInvitation: async (id, updates) => {
    const { data, error } = await supabase
      .from('partner_invitations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete invitation
  deleteInvitation: async (id) => {
    const { error } = await supabase
      .from('partner_invitations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Submit draft invitations (change status from draft to submitted)
  submitDrafts: async (partnerId, eventType = null) => {
    let query = supabase
      .from('partner_invitations')
      .update({ status: 'submitted' })
      .eq('partner_id', partnerId)
      .eq('status', 'draft');

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query.select();
    if (error) throw error;
    return data;
  },

  // Get used invite count for an event
  getUsedInviteCount: async (partnerId, eventType) => {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('invite_count')
      .eq('partner_id', partnerId)
      .eq('event_type', eventType)
      .in('status', ['submitted', 'processing', 'confirmed']); // Only count non-draft, non-rejected
    
    if (error) throw error;
    return data.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
  },
};

