import { base44 } from "@/api/base44Client";

// Notify admins when a new guest list is submitted
export async function notifyAdminsGuestListSubmitted(partnerEmail, eventType, inviteCount) {
  const eventNames = {
    opening_ceremony: "Opening Ceremony",
    sef_vault: "SEF Vault",
    closing_ceremony: "Closing Ceremony"
  };
  const eventName = eventNames[eventType] || eventType;

  // Get all admin users
  const allUsers = await base44.entities.User.list();
  const admins = allUsers.filter(u => u.role === 'admin' || u.is_super_admin);

  // Create notification for each admin
  await Promise.all(admins.map(admin => 
    base44.entities.StatusUpdate.create({
      partner_email: admin.email,
      title: "New Guest List Submitted",
      message: `${partnerEmail} submitted a guest list for ${eventName} with ${inviteCount} invites. Please review and process.`,
      type: "action_required",
      read: false
    })
  ));
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
      const recentNotifications = await base44.entities.StatusUpdate.filter({
        partner_email: partnerEmail
      });
      
      const alreadyNotified = recentNotifications.some(n => 
        n.title.includes(`${alloc.name} Allocation Running Low`) &&
        new Date(n.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (!alreadyNotified) {
        await base44.entities.StatusUpdate.create({
          partner_email: partnerEmail,
          title: `${alloc.name} Allocation Running Low`,
          message: `You have only ${remaining} out of ${alloc.allocation} invites remaining for ${alloc.name}. Contact your account manager if you need additional allocation.`,
          type: "warning",
          read: false
        });
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

  await base44.entities.StatusUpdate.create({
    partner_email: partnerEmail,
    title: `${eventName} Invitation ${newStatus === 'confirmed' ? 'Confirmed' : 'Status Updated'}`,
    message,
    type,
    read: false
  });
}

// Notify partner about upcoming event (call this from a scheduled function or manually)
export async function notifyUpcomingEvent(partnerEmail, eventType, daysUntilEvent) {
  const eventNames = {
    opening_ceremony: "Opening Ceremony",
    sef_vault: "SEF Vault",
    closing_ceremony: "Closing Ceremony"
  };
  const eventName = eventNames[eventType] || eventType;

  await base44.entities.StatusUpdate.create({
    partner_email: partnerEmail,
    title: `${eventName} Coming Up!`,
    message: `Reminder: The ${eventName} is in ${daysUntilEvent} day${daysUntilEvent > 1 ? 's' : ''}. Make sure your guest list is finalized and your guests have received their invitations.`,
    type: "info",
    read: false
  });
}

// Update VIP invitation status and notify partner (for admin use)
export async function updateInvitationStatusWithNotification(invitationId, newStatus, partnerEmail, eventType) {
  // Update the invitation
  await base44.entities.VIPInvitation.update(invitationId, { status: newStatus });
  
  // Notify the partner
  await notifyPartnerStatusChange(partnerEmail, eventType, null, newStatus);
  
  return true;
}

// Send email notification for important VIP events
export async function sendVIPEmailNotification(partnerEmail, subject, message) {
  try {
    await base44.integrations.Core.SendEmail({
      to: partnerEmail,
      subject: `[SEF 2026] ${subject}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SEF 2026 - BELONG+</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            ${message}
          </div>
          <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This is an automated notification from the SEF Partner Portal.</p>
            <p>© 2026 Sharjah Entrepreneurship Festival</p>
          </div>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}