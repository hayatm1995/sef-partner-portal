import { supabase } from '@/config/supabase';

/**
 * Analytics Service for Admin Dashboard
 * Provides aggregated data for KPIs, charts, and partner progress
 */

export const analyticsService = {
  // Get summary KPIs
  getSummary: async () => {
    // Total Partners
    const { count: totalPartners } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true });

    // Active Partner Users
    const { count: activeUsers } = await supabase
      .from('partner_users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'sef_admin', 'partner']);

    // Deliverables completion - % of deliverables with at least one approved submission
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('id');

    // Get unique deliverable_ids that have at least one approved submission
    const { data: approvedSubmissions } = await supabase
      .from('partner_submissions')
      .select('deliverable_id')
      .eq('status', 'approved');

    const uniqueApprovedDeliverables = new Set(
      approvedSubmissions?.map(s => s.deliverable_id) || []
    );
    const deliverablesCompletion = deliverables?.length > 0
      ? Math.round((uniqueApprovedDeliverables.size / deliverables.length) * 100)
      : 0;

    // Exhibitor Stands Progress
    const { data: booths } = await supabase
      .from('booths')
      .select('status');

    const boothStats = {
      pending: booths?.filter(b => b.status === 'pending').length || 0,
      review: booths?.filter(b => b.status === 'review').length || 0,
      approved: booths?.filter(b => b.status === 'approved').length || 0,
      rejected: booths?.filter(b => b.status === 'rejected').length || 0,
      total: booths?.length || 0
    };

    // BELONG+ Invitations
    const { data: invitations } = await supabase
      .from('partner_invitations')
      .select('invite_count, status');

    const totalInvites = invitations?.reduce((sum, inv) => sum + (inv.invite_count || 0), 0) || 0;
    const confirmedInvites = invitations
      ?.filter(inv => inv.status === 'confirmed')
      .reduce((sum, inv) => sum + (inv.invite_count || 0), 0) || 0;

    // New Activity This Week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: newActivity } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    return {
      totalPartners: totalPartners || 0,
      activeUsers: activeUsers || 0,
      deliverablesCompletion,
      deliverablesTotal: deliverables?.length || 0,
      deliverablesApproved: uniqueApprovedDeliverables.size,
      boothStats,
      totalInvites,
      confirmedInvites,
      newActivity: newActivity || 0
    };
  },

  // Get deliverables by status
  // Aggregate across all partner_submissions - get latest status per deliverable
  getDeliverablesByStatus: async () => {
    // Get all submissions with their status, ordered by created_at desc
    const { data: submissions } = await supabase
      .from('partner_submissions')
      .select('status, deliverable_id, created_at')
      .order('created_at', { ascending: false });

    // Group by deliverable_id and get latest status (first one in desc order)
    const deliverableStatusMap = {};
    submissions?.forEach(sub => {
      if (!deliverableStatusMap[sub.deliverable_id]) {
        deliverableStatusMap[sub.deliverable_id] = sub.status;
      }
    });

    // Count by status
    // Note: partner_submissions uses 'pending', 'approved', 'rejected'
    // For display purposes, treat 'pending' as both pending and under_review
    const statusCounts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    Object.values(deliverableStatusMap).forEach(status => {
      if (status === 'pending') {
        statusCounts.pending++;
        statusCounts.under_review++; // Also count as under_review
      } else if (status === 'approved') {
        statusCounts.approved++;
      } else if (status === 'rejected') {
        statusCounts.rejected++;
      }
    });

    return statusCounts;
  },

  // Get stands by status
  getStandsByStatus: async () => {
    const { data: booths } = await supabase
      .from('booths')
      .select('status');

    return {
      pending: booths?.filter(b => b.status === 'pending').length || 0,
      review: booths?.filter(b => b.status === 'review').length || 0,
      approved: booths?.filter(b => b.status === 'approved').length || 0,
      rejected: booths?.filter(b => b.status === 'rejected').length || 0,
      total: booths?.length || 0
    };
  },

  // Get partner progress overview
  getPartnerProgress: async () => {
    // Get all partners
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name, tier');

    if (!partners) return [];

    // Get deliverables per partner
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('id, partner_id');

    // Get approved submissions per partner
    // Use partner_submissions - count unique deliverable_ids with approved status
    const { data: approvedSubmissions } = await supabase
      .from('partner_submissions')
      .select('deliverable_id, partner_id, status')
      .eq('status', 'approved');

    // Get booths per partner
    const { data: booths } = await supabase
      .from('booths')
      .select('id, partner_id, status');

    // Get VIP invitations per partner
    const { data: invitations } = await supabase
      .from('partner_invitations')
      .select('partner_id, invite_count, status');

    // Get last activity per partner
    const { data: activities } = await supabase
      .from('activity_log')
      .select('partner_id, created_at')
      .order('created_at', { ascending: false });

    // Build partner progress data
    return partners.map(partner => {
      const partnerDeliverables = deliverables?.filter(d => d.partner_id === partner.id) || [];
      const partnerApprovedSubmissions = approvedSubmissions?.filter(
        s => s.partner_id === partner.id
      ) || [];
      const uniqueApprovedDeliverables = new Set(
        partnerApprovedSubmissions.map(s => s.deliverable_id)
      );

      const partnerBooths = booths?.filter(b => b.partner_id === partner.id) || [];
      const approvedBooths = partnerBooths.filter(b => b.status === 'approved').length;

      const partnerInvitations = invitations?.filter(i => i.partner_id === partner.id) || [];
      const totalInvites = partnerInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
      const confirmedInvites = partnerInvitations
        .filter(inv => inv.status === 'confirmed')
        .reduce((sum, inv) => sum + (inv.invite_count || 0), 0);

      const partnerActivities = activities?.filter(a => a.partner_id === partner.id) || [];
      const lastActivity = partnerActivities.length > 0
        ? new Date(partnerActivities[0].created_at)
        : null;

      const completionPercent = partnerDeliverables.length > 0
        ? Math.round((uniqueApprovedDeliverables.size / partnerDeliverables.length) * 100)
        : 0;

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        tier: partner.tier || 'N/A',
        deliverablesTotal: partnerDeliverables.length,
        deliverablesApproved: uniqueApprovedDeliverables.size,
        completionPercent,
        boothsTotal: partnerBooths.length,
        boothsApproved: approvedBooths,
        vipInvitesTotal: totalInvites,
        vipInvitesConfirmed: confirmedInvites,
        lastActivity
      };
    });
  }
};


