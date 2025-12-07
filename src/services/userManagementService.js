import { nanoid } from 'nanoid';

/**
 * User Management Service
 * Handles user creation, onboarding, and management using Supabase Admin API
 */

// Generate a random temporary password using nanoid
export function generateTemporaryPassword() {
  return 'SEF!' + nanoid(10);
}

/**
 * Create a new user with Supabase Admin API
 * Note: This requires a service role key, not the anon key
 * You'll need to create a backend endpoint or use Supabase Edge Functions
 */
export async function createUserWithAdminAPI(userData) {
  const { email, password, fullName, role, partnerId } = userData;

  // For now, we'll use a client-side approach with the service role
  // In production, this should be done via a backend API or Edge Function
  // that has the service role key
  
  // Check if we have service role key (should be in server-side only)
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Service role key not configured. User creation must be done server-side.');
  }

  // Create Supabase admin client (only use this server-side!)
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      }
    });

    if (authError) throw authError;
    if (!authUser?.user) throw new Error('Failed to create auth user');

    // 2. Insert into partner_users table
    // Map role: 'superadmin' -> 'superadmin', 'admin' -> 'admin', others -> 'partner'
    const dbRole = role === 'superadmin' ? 'superadmin' : (role === 'admin' ? 'admin' : 'partner');
    // Use admin client for inserting (has proper permissions)
    const { data: partnerUser, error: partnerUserError } = await supabaseAdmin
      .from('partner_users')
      .insert({
        auth_user_id: authUser.user.id,
        partner_id: partnerId || null,
        email,
        full_name: fullName,
        role: dbRole,
      })
      .select()
      .single();

    if (partnerUserError) {
      // If partner_user insert fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw partnerUserError;
    }

    // 3. Generate recovery link for onboarding email
    const { data: recoveryLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (linkError) {
      console.warn('Failed to generate recovery link:', linkError);
    }

    return {
      authUser: authUser.user,
      partnerUser,
      recoveryLink: recoveryLink?.properties?.action_link || null,
      temporaryPassword: password,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Alternative: Create user via Edge Function or backend API
 * This is the recommended approach for production
 */
export async function createUserViaAPI(userData) {
  // Get current session for authorization
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Use Supabase Edge Function URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/admin-create-user`
    : '/api/admin-create-user';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      // For Supabase Edge Functions, also need apikey
      ...(import.meta.env.VITE_SUPABASE_ANON_KEY && {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      }),
    },
    body: JSON.stringify({
      email: userData.email,
      full_name: userData.fullName,
      partner_id: userData.partnerId || null,
      role: userData.role,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Failed to create user');
  }

  const result = await response.json();
  
  // Send onboarding email (if email service is configured)
  if (result.email_data) {
    try {
      await sendOnboardingEmail(
        result.email_data.to,
        result.email_data.recovery_link,
        result.email_data.portal_url,
        result.email_data.support_email
      );
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't throw - user creation succeeded
    }
  }

  return result;
}

/**
 * Log activity to activity_log table
 */
export async function logActivity(activityData) {
  try {
    const { activityLogService } = await import('./supabaseService');
    return await activityLogService.create({
      activity_type: activityData.type,
      user_email: activityData.userEmail,
      target_user_email: activityData.targetUserEmail,
      description: activityData.description,
      metadata: activityData.metadata || {},
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Send onboarding email
 * This should be done via a backend service or email service
 */
export async function sendOnboardingEmail(email, recoveryLink, portalUrl, supportEmail) {
  // In production, this should call your email service
  // For now, we'll create the email content and log it
  const emailContent = {
    to: email,
    subject: 'Welcome to SEF Partner Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SEF Partner Portal</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your account has been created for the Sharjah Entrepreneurship Festival 2026 Partner Portal.</p>
            <p><strong>Portal Login:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
            <p>To get started, please set up your password by clicking the link below:</p>
            <p style="text-align: center;">
              <a href="${recoveryLink}" class="button">Set Up Password</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${recoveryLink}</p>
            <p>If you have any questions, please contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
            <p>Best regards,<br>SEF Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  console.log('Onboarding email content:', emailContent);

  // TODO: Integrate with your email service (SendGrid, Resend, etc.)
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@visitsef.com',
  //   to: email,
  //   subject: emailContent.subject,
  //   html: emailContent.html,
  // });

  return true;
}

