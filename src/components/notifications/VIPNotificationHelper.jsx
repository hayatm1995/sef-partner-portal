// src/components/notifications/VIPNotificationHelper.jsx
import { supabase } from '@/config/supabase';
import { notificationsService } from '@/services/supabaseService';

/**
 * Notify admins when a new guest list is submitted
 */
export async function notifyAdminsGuestListSubmitted(partnerEmail, eventType, inviteCount) {
  const eventNames = {
    opening_ceremony: "Opening Ceremony",
    sef_vault: "SEF Vault",
    closing_ceremony: "Closing Ceremony"
  };
  const eventName = eventNames[eventType] || eventType;

  try {
    // Get all admin users from partner_users table
    const { data: allPartnerUsers, error: usersError } = await supabase
      .from('partner_users')
      .select('id, partner_id, email, role')
      .in('role', ['admin', 'sef_admin']);

    if (usersError) {
      console.error('Error fetching admin users:', usersError);
      return;
    }

    if (!allPartnerUsers || allPartnerUsers.length === 0) {
      console.warn('No admin users found');
      return;
    }

    // Create notification for each admin's partner
    const notificationPromises = allPartnerUsers.map(async (admin) => {
      if (!admin.partner_id) {
        console.warn(`Admin ${admin.email} has no partner_id`);
        return;
      }

      try {
        await notificationsService.create({
          partner_id: admin.partner_id,
          type: 'action_required',
          title: "New Guest List Submitted",
          message: `${partnerEmail} submitted a guest list for ${eventName} with ${inviteCount} invite${inviteCount !== 1 ? 's' : ''}. Please review and process.`,
        });
      } catch (error) {
        console.error(`Error creating notification for admin ${admin.email}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error in notifyAdminsGuestListSubmitted:', error);
  }
}

// Notify partner when their invitation allocation is running low (< 20% remaining)
export async function checkAndNotifyLowAllocation(partnerEmail, profile, invitations) {
  const allocations = [
    { 
      type: "opening_ceremony", 
      name: "Opening Ceremony",
      allocation: profile?.belong_plus_opening_ceremony_allocation || 0 
    },
    { 
      type: "sef_vault", 
      name: "SEF Vault",
      allocation: profile?.belong_plus_sef_vault_allocation || 0 
    },
    { 
      type: "closing_ceremony", 
      name: "Closing Ceremony",
      allocation: profile?.belong_plus_closing_ceremony_allocation || 0 
    }
  ];

  // Get partner_id for the partner email
  const { data: partnerData } = await supabase
    .from('partners')
    .select('id')
    .eq('email', partnerEmail)
    .single();

  const partnerId = partnerData?.id;
  if (!partnerId) {
    console.warn('Partner not found for email:', partnerEmail);
    return;
  }

  for (const alloc of allocations) {
    if (alloc.allocation === 0) continue;

    const used = invitations
      .filter(inv => inv.event_type === alloc.type)
      .reduce((sum, inv) => sum + (inv.invite_count || 0), 0);

    const remaining = alloc.allocation - used;
    const percentRemaining = (remaining / alloc.allocation) * 100;

    // Notify if less than 20% remaining and more than 0
    if (percentRemaining <= 20 && remaining > 0) {
      // Check if we already sent this notification recently (within last 24 hours)
      try {
        const recentNotifications = await notificationsService.getByPartnerId(partnerId);
        
        const alreadyNotified = recentNotifications.some(n => 
          n.title?.includes(`${alloc.name} Allocation Running Low`) &&
          new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!alreadyNotified) {
          await notificationsService.create({
            partner_id: partnerId,
            type: 'warning',
            title: `${alloc.name} Allocation Running Low`,
            message: `You have only ${remaining} out of ${alloc.allocation} invites remaining for ${alloc.name}. Contact your account manager if you need additional allocation.`,
          });
        }
      } catch (error) {
        console.error('Error checking/creating low allocation notification:', error);
      }
    }
  }
}

// Notify partner when invitation status changes
export async function notifyPartnerStatusChange(partnerEmail, eventType, oldStatus, newStatus) {
  const eventNames = {
    opening_ceremony: "Opening Ceremony",
    sef_vault: "SEF Vault",
    closing_ceremony: "Closing Ceremony"
  };
  const eventName = eventNames[eventType] || eventType;

  const statusMessages = {
    processing: `Your guest list for ${eventName} is now being processed.`,
    confirmed: `Great news! Your guest list for ${eventName} has been confirmed. Your guests are all set!`,
  };

  const message = statusMessages[newStatus] || `Your ${eventName} invitation status has been updated to ${newStatus}.`;
  const type = newStatus === 'confirmed' ? 'success' : 'info';

  // Get partner_id for the partner email
  const { data: partnerData } = await supabase
    .from('partners')
    .select('id')
    .eq('email', partnerEmail)
    .single();

  const partnerId = partnerData?.id;
  if (!partnerId) {
    console.warn('Partner not found for email:', partnerEmail);
    return;
  }

  try {
    await notificationsService.create({
      partner_id: partnerId,
      type: type,
      title: `${eventName} Invitation ${newStatus === 'confirmed' ? 'Confirmed' : 'Status Updated'}`,
      message: message,
    });
  } catch (error) {
    console.error('Error creating status change notification:', error);
  }
}

// Notify partner about upcoming event (call this from a scheduled function or manually)
export async function notifyUpcomingEvent(partnerEmail, eventType, daysUntilEvent) {
  const eventNames = {
    opening_ceremony: "Opening Ceremony",
    sef_vault: "SEF Vault",
    closing_ceremony: "Closing Ceremony"
  };
  const eventName = eventNames[eventType] || eventType;

  // Get partner_id for the partner email
  const { data: partnerData } = await supabase
    .from('partners')
    .select('id')
    .eq('email', partnerEmail)
    .single();

  const partnerId = partnerData?.id;
  if (!partnerId) {
    console.warn('Partner not found for email:', partnerEmail);
    return;
  }

  try {
    await notificationsService.create({
      partner_id: partnerId,
      type: 'info',
      title: `${eventName} Coming Up!`,
      message: `Reminder: The ${eventName} is in ${daysUntilEvent} day${daysUntilEvent > 1 ? 's' : ''}. Make sure your guest list is finalized and your guests have received their invitations.`,
    });
  } catch (error) {
    console.error('Error creating upcoming event notification:', error);
  }
}

// Update VIP invitation status and notify partner (for admin use)
// TODO: Migrate VIP invitations to Supabase table when available
export async function updateInvitationStatusWithNotification(invitationId, newStatus, partnerEmail, eventType) {
  try {
    // TODO: Update VIP invitation in Supabase when table is available
    // await supabase.from('vip_invitations').update({ status: newStatus }).eq('id', invitationId);
    console.warn('VIP invitation update - Supabase migration pending');
    
    // Notify the partner
    await notifyPartnerStatusChange(partnerEmail, eventType, null, newStatus);
    
    return true;
  } catch (error) {
    console.error('Error updating invitation status:', error);
    return false;
  }
}

// Send email notification for important VIP events
// TODO: Implement Supabase email sending (via Edge Functions or external service)
export async function sendVIPEmailNotification(partnerEmail, subject, message) {
  try {
    // TODO: Implement Supabase email sending
    console.warn('Email sending - Supabase migration pending');
    // Placeholder: await sendEmailViaSupabase({ ... });
    
    return false; // Return false until email service is implemented
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}