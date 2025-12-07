import { supabase } from '@/config/supabase';

// ============================================
// PARTNERS
// ============================================

export const partnersService = {
  // Get all partners (admin only)
  getAll: async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get partner by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get partner by user email
  getByUserEmail: async (email) => {
    const { data: userData, error: userError } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('email', email)
      .single();
    
    if (userError) throw userError;
    if (!userData) return null;

    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', userData.partner_id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create partner
  create: async (partnerData) => {
    const { data, error } = await supabase
      .from('partners')
      .insert(partnerData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update partner
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete partner
  delete: async (id) => {
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// PARTNER USERS
// ============================================

export const partnerUsersService = {
  // Get user by email
  getByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('partner_users')
        .select(`
          *,
          partners (*)
        `)
        .eq('email', email)
        .single();
      
      // PGRST116 = not found (no rows returned) - this is OK, return null
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching partner user by email:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('getByEmail error:', error);
      return null; // Return null instead of throwing
    }
  },

  // Get all users for a partner
  getByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_users')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create partner user
  create: async (userData) => {
    const { data, error } = await supabase
      .from('partner_users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update partner user
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('partner_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete partner user
  delete: async (id) => {
    const { error } = await supabase
      .from('partner_users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get all users (for admin/superadmin views)
  getAll: async () => {
    const { data, error } = await supabase
      .from('partner_users')
      .select(`
        *,
        partners (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get users by role
  getByRole: async (role) => {
    const { data, error } = await supabase
      .from('partner_users')
      .select(`
        *,
        partners (*)
      `)
      .eq('role', role)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};

// ============================================
// EXHIBITOR STANDS
// ============================================

export const exhibitorStandsService = {
  // Get all stands (admin) or by partner
  getAll: async (partnerId = null) => {
    let query = supabase
      .from('exhibitor_stands')
      .select(`
        *,
        partners (*)
      `)
      .order('updated_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get stand by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('exhibitor_stands')
      .select(`
        *,
        partners (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create stand
  create: async (standData) => {
    const { data, error } = await supabase
      .from('exhibitor_stands')
      .insert(standData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update stand
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('exhibitor_stands')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete stand
  delete: async (id) => {
    const { error } = await supabase
      .from('exhibitor_stands')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// DELIVERABLES
// ============================================

export const deliverablesService = {
  // Get all deliverables (admin) or by partner
  getAll: async (partnerId = null, category = null) => {
    let query = supabase
      .from('deliverables')
      .select(`
        *,
        partners (*)
      `)
      .order('created_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    } else if (partnerId === null) {
      // If partnerId is explicitly null, get global deliverables (partner_id IS NULL)
      query = query.is('partner_id', null);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get exhibitor deliverables (global templates)
  getExhibitorDeliverables: async (buildOption = 'sef_built') => {
    let query = supabase
      .from('deliverables')
      .select('*')
      .eq('category', 'exhibitor')
      .is('partner_id', null)
      .order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // Filter out custom_build only deliverables if buildOption is sef_built
    if (buildOption === 'sef_built') {
      return data.filter(d => {
        const notes = d.notes || '';
        return !notes.includes('custom build');
      });
    }

    return data;
  },

  // Get deliverable by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('deliverables')
      .select(`
        *,
        partners (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create deliverable
  create: async (deliverableData) => {
    const { data, error } = await supabase
      .from('deliverables')
      .insert(deliverableData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update deliverable
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('deliverables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete deliverable
  delete: async (id) => {
    const { error } = await supabase
      .from('deliverables')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// NOMINATIONS
// ============================================

export const nominationsService = {
  // Get all nominations (admin) or by partner
  getAll: async (partnerId = null) => {
    let query = supabase
      .from('nominations')
      .select('*')
      .order('created_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[nominationsService] Error fetching nominations:', error);
      throw error;
    }
    return data || [];
  },

  // Get nomination by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('nominations')
      .select(`
        *,
        partners (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create nomination
  create: async (nominationData) => {
    const { data, error } = await supabase
      .from('nominations')
      .insert(nominationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update nomination
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('nominations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete nomination
  delete: async (id) => {
    const { error } = await supabase
      .from('nominations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsService = {
  // Get all notifications for a partner
  getByPartnerId: async (partnerId, unreadOnly = false) => {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get notification by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create notification
  create: async (notificationData) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Notifications] Creating notification:', notificationData);
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        metadata: notificationData.metadata || {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Notifications] Notification created:', data.id);
    }
    
    return data;
  },

  // Mark as read
  markAsRead: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark all as read for partner
  markAllAsRead: async (partnerId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('partner_id', partnerId)
      .eq('read', false);
    
    if (error) throw error;
  },

  // Delete notification
  delete: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============================================
  // ADMIN METHODS
  // ============================================

  // Get all notifications (admin only) with filters
  getAllForAdmin: async (filters = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Notifications] Fetching all notifications for admin:', filters);
    }
    
    let query = supabase
      .from('notifications')
      .select(`
        *,
        partners (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.partner_id) {
      query = query.eq('partner_id', filters.partner_id);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Notifications] Fetched', data.length, 'notifications');
    }
    
    return data;
  },

  // Get unread count for a partner
  getUnreadCount: async (partnerId) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .eq('read', false);
    
    if (error) throw error;
    return count || 0;
  },
};

// ============================================
// ACTIVITY LOG
// ============================================

export const activityLogService = {
  // Create activity log entry
  create: async (logData) => {
    const { data, error } = await supabase
      .from('activity_log')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get activity logs for a partner
  getByPartnerId: async (partnerId, limit = 50) => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Get all activity logs (admin only) - recent activity
  getAll: async (limit = 10) => {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        partner:partners(id, name),
        user:partner_users(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },
};

// ============================================
// PARTNER SUBMISSIONS
// ============================================

export const partnerSubmissionsService = {
  // Get all submissions for a deliverable (with version history)
  getByDeliverableId: async (deliverableId) => {
    const { data, error } = await supabase
      .from('partner_submissions')
      .select(`
        *,
        submitted_by_user:partner_users!submitted_by(id, full_name, email),
        uploaded_by_user:partner_users!uploaded_by(id, full_name, email),
        reviewed_by_user:partner_users!reviewed_by(id, full_name, email)
      `)
      .eq('deliverable_id', deliverableId)
      .order('version', { ascending: false }); // Order by version, newest first
    
    if (error) throw error;
    return data;
  },

  // Get latest submission for a deliverable
  getLatestByDeliverableId: async (deliverableId) => {
    const { data, error } = await supabase
      .from('partner_submissions')
      .select(`
        *,
        submitted_by_user:partner_users!submitted_by(id, full_name, email),
        reviewed_by_user:partner_users!reviewed_by(id, full_name, email)
      `)
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all submissions for a partner
  getByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_submissions')
      .select(`
        *,
        deliverables (*),
        submitted_by_user:partner_users!submitted_by(id, full_name, email),
        reviewed_by_user:partner_users!reviewed_by(id, full_name, email)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get all submissions (admin only)
  getAll: async () => {
    const { data, error } = await supabase
      .from('partner_submissions')
      .select(`
        *,
        deliverables (*),
        submitted_by_user:partner_users!submitted_by(id, full_name, email),
        reviewed_by_user:partner_users!reviewed_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create submission (version auto-incremented by trigger)
  create: async (submissionData) => {
    // Ensure uploaded_by is set if not provided
    if (!submissionData.uploaded_by && submissionData.submitted_by) {
      submissionData.uploaded_by = submissionData.submitted_by;
    }
    
    const { data, error } = await supabase
      .from('partner_submissions')
      .insert(submissionData)
      .select(`
        *,
        submitted_by_user:partner_users!submitted_by(id, full_name, email),
        uploaded_by_user:partner_users!uploaded_by(id, full_name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update submission
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('partner_submissions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        reviewed_by_user:partner_users!reviewed_by(id, full_name, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete submission
  delete: async (id) => {
    const { error } = await supabase
      .from('partner_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// DELIVERABLE COMMENTS
// ============================================

export const deliverableCommentsService = {
  // Get all comments for a deliverable
  getByDeliverableId: async (deliverableId) => {
    const { data, error } = await supabase
      .from('deliverable_comments')
      .select(`
        *,
        user:partner_users!user_id(id, full_name, email, role)
      `)
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get comments for a specific submission
  getBySubmissionId: async (submissionId) => {
    const { data, error } = await supabase
      .from('deliverable_comments')
      .select(`
        *,
        user:partner_users!user_id(id, full_name, email, role)
      `)
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create comment
  create: async (commentData) => {
    const { data, error } = await supabase
      .from('deliverable_comments')
      .insert(commentData)
      .select(`
        *,
        user:partner_users!user_id(id, full_name, email, role)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete comment (optional - for future use)
  delete: async (id) => {
    const { error } = await supabase
      .from('deliverable_comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// PARTNER PROGRESS
// ============================================

export const partnerProgressService = {
  // Get progress for a specific partner
  getByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from('v_partner_progress')
      .select('*')
      .eq('partner_id', partnerId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get progress for all partners
  getAll: async () => {
    const { data, error } = await supabase
      .from('v_partner_progress')
      .select('*')
      .order('progress_percentage', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
};

// ============================================
// BOOTH ARTWORK
// ============================================

export const boothArtworkService = {
  // Get all artwork for a booth
  getByBoothId: async (boothId) => {
    const { data, error } = await supabase
      .from('booth_artwork')
      .select('*')
      .eq('booth_id', boothId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create artwork entry
  create: async (artworkData) => {
    const { data, error } = await supabase
      .from('booth_artwork')
      .insert(artworkData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete artwork
  delete: async (id) => {
    const { error } = await supabase
      .from('booth_artwork')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// BOOTH DISCUSSIONS
// ============================================

export const boothDiscussionsService = {
  // Get all discussions for a booth
  getByBoothId: async (boothId) => {
    const { data, error } = await supabase
      .from('booth_discussions')
      .select('*')
      .eq('booth_id', boothId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create discussion message
  create: async (messageData) => {
    const { data, error } = await supabase
      .from('booth_discussions')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// ============================================
// PARTNER MESSAGES
// ============================================

export const partnerMessagesService = {
  // Get all messages for a partner
  getByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_messages')
      .select(`
        *,
        sender:auth.users!sender_id(id, email)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get unread count for a partner
  getUnreadCount: async (partnerId) => {
    const { count, error } = await supabase
      .from('partner_messages')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  // Get unread count for admin (across all partners)
  getAdminUnreadCount: async () => {
    const { count, error } = await supabase
      .from('partner_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  // Get partners with unread messages (for admin view)
  getPartnersWithUnread: async () => {
    const { data, error } = await supabase
      .from('partner_messages')
      .select(`
        partner_id,
        partners!inner(id, name),
        is_read
      `)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group by partner_id and count unread
    const partnerMap = {};
    data.forEach(msg => {
      const partnerId = msg.partner_id;
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          partner_id: partnerId,
          partner: msg.partners,
          unread_count: 0,
        };
      }
      partnerMap[partnerId].unread_count++;
    });
    
    return Object.values(partnerMap);
  },

  // Create message
  create: async (messageData) => {
    // Ensure sender_role is set if not provided
    if (!messageData.sender_role) {
      // Try to determine from current user context
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: partnerUser } = await supabase
          .from('partner_users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (partnerUser?.role && ['admin', 'sef_admin', 'superadmin'].includes(partnerUser.role)) {
          messageData.sender_role = 'admin';
        } else {
          messageData.sender_role = 'partner';
        }
      }
    }
    
    const { data, error } = await supabase
      .from('partner_messages')
      .insert(messageData)
      .select(`
        *,
        sender:auth.users!sender_id(id, email)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get messages by deliverable_id
  getByDeliverableId: async (deliverableId) => {
    const { data, error } = await supabase
      .from('partner_messages')
      .select(`
        *,
        sender:auth.users!sender_id(id, email)
      `)
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Mark messages as read
  markAsRead: async (partnerId, messageIds = null) => {
    let query = supabase
      .from('partner_messages')
      .update({ is_read: true })
      .eq('partner_id', partnerId)
      .eq('is_read', false);
    
    if (messageIds && messageIds.length > 0) {
      query = query.in('id', messageIds);
    }
    
    const { error } = await query;
    if (error) throw error;
  },

  // Mark single message as read
  markMessageAsRead: async (messageId) => {
    const { error } = await supabase
      .from('partner_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    if (error) throw error;
  },
};

// ============================================
// CONTRACTS
// ============================================

export const contractsService = {
  // Get all contracts for a partner
  getByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get contract by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all contracts (admin only)
  getAll: async (filters = {}) => {
    let query = supabase
      .from('contracts')
      .select(`
        *,
        partners (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.partner_id) {
      query = query.eq('partner_id', filters.partner_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Create contract with notifications
  create: async (contractData) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Contracts] Creating contract:', contractData);
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) throw error;

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Contracts] Contract created:', data.id);
    }

    // Create notification for partner
    try {
      const { notificationsService } = await import('./supabaseService');
      await notificationsService.create({
        partner_id: contractData.partner_id,
        type: 'contract_received',
        title: `New Contract Received`,
        message: `A new contract "${contractData.title}" has been sent to you.`,
        metadata: {
          contract_id: data.id,
          contract_title: contractData.title,
          contract_type: contractData.contract_type,
        }
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return data;
  },

  // Update contract
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update status with notifications
  updateStatus: async (id, status, notes = null) => {
    // Get contract to get partner_id
    const contract = await contractsService.getById(id);
    
    const updates = { status };
    if (notes) updates.notes = notes;

    const updated = await contractsService.update(id, updates);

    // Create notification for status change
    try {
      const { notificationsService } = await import('./supabaseService');
      await notificationsService.create({
        partner_id: contract.partner_id,
        type: 'contract_status_change',
        title: `Contract Status Updated`,
        message: `Your contract "${contract.title}" status has been updated to ${status}.`,
        metadata: {
          contract_id: id,
          contract_title: contract.title,
          status: status,
          notes: notes,
        }
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return updated;
  },

  // Upload signed contract with notifications
  uploadSigned: async (id, fileUrl) => {
    const contract = await contractsService.getById(id);
    
    const updated = await contractsService.update(id, {
      file_url_signed: fileUrl,
      status: 'signed'
    });

    // Notify admin that contract has been signed
    try {
      const { notificationsService } = await import('./supabaseService');
      // Get all admins and notify them
      const { data: admins } = await supabase
        .from('partner_users')
        .select('partner_id')
        .in('role', ['admin', 'sef_admin'])
        .limit(1);

      if (admins && admins.length > 0) {
        // Create notification for admin (we'll use a special admin notification system)
        // For now, we'll create it with partner_id = null or use a system notification
        await notificationsService.create({
          partner_id: contract.partner_id,
          type: 'contract_signed',
          title: `Contract Signed`,
          message: `Contract "${contract.title}" has been signed by partner.`,
          metadata: {
            contract_id: id,
            contract_title: contract.title,
            file_url_signed: fileUrl,
          }
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return updated;
  },

  // Delete contract
  delete: async (id) => {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// CONTRACT DISCUSSIONS
// ============================================

export const contractDiscussionsService = {
  // Get discussions for a contract
  getByContractId: async (contractId) => {
    const { data, error } = await supabase
      .from('contract_discussions')
      .select(`
        *,
        sender:partner_users!sender_id (
          id,
          full_name,
          email
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create discussion message
  create: async (discussionData) => {
    const { data, error } = await supabase
      .from('contract_discussions')
      .insert(discussionData)
      .select(`
        *,
        sender:partner_users!sender_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to discussions for real-time updates
  subscribeToDiscussions: (contractId, callback) => {
    const channel = supabase
      .channel(`contract_discussions:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contract_discussions',
          filter: `contract_id=eq.${contractId}`,
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
};

// ============================================
// PARTNER FEATURES
// ============================================

export const partnerFeaturesService = {
  // Get all enabled features for a partner
  getEnabledFeatures: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_features')
      .select('feature')
      .eq('partner_id', partnerId)
      .eq('enabled', true);
    
    if (error) throw error;
    return data.map(item => item.feature);
  },

  // Get all features (enabled and disabled) for a partner
  getAllFeatures: async (partnerId) => {
    const { data, error } = await supabase
      .from('partner_features')
      .select('*')
      .eq('partner_id', partnerId)
      .order('feature');
    
    if (error) throw error;
    return data;
  },

  // Check if a specific feature is enabled for a partner
  isFeatureEnabled: async (partnerId, feature) => {
    const { data, error } = await supabase
      .from('partner_features')
      .select('enabled')
      .eq('partner_id', partnerId)
      .eq('feature', feature)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.enabled ?? true; // Default to enabled if not found
  },

  // Update feature status (enable/disable)
  updateFeature: async (partnerId, feature, enabled) => {
    const { data, error } = await supabase
      .from('partner_features')
      .upsert({
        partner_id: partnerId,
        feature: feature,
        enabled: enabled,
      }, {
        onConflict: 'partner_id,feature'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update multiple features at once
  updateFeatures: async (partnerId, features) => {
    // features should be an array of { feature, enabled }
    const updates = features.map(f => ({
      partner_id: partnerId,
      feature: f.feature,
      enabled: f.enabled,
    }));

    const { data, error } = await supabase
      .from('partner_features')
      .upsert(updates, {
        onConflict: 'partner_id,feature'
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  // Initialize default features for a partner (all enabled)
  initializeDefaultFeatures: async (partnerId) => {
    const defaultFeatures = [
      'Company Profile',
      'Deliverables',
      'Booth Options',
      'VIP Guest List',
      'Media Uploads',
      'Payments',
      'Legal & Branding',
      'Speaker Requests',
      'Nominations'
    ];

    const features = defaultFeatures.map(feature => ({
      partner_id: partnerId,
      feature: feature,
      enabled: true,
    }));

    const { data, error } = await supabase
      .from('partner_features')
      .upsert(features, {
        onConflict: 'partner_id,feature'
      })
      .select();
    
    if (error) throw error;
    return data;
  },
};

