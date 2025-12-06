/**
 * Serverless API Route: /api/admin-create-user
 * 
 * This can be deployed as:
 * - Supabase Edge Function (recommended)
 * - Vercel Serverless Function
 * - Netlify Function
 * - Express.js route
 * 
 * For Supabase Edge Function, see: supabase/functions/admin-create-user/index.ts
 * 
 * For Node.js/Express backend, use this file:
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify requesting user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: userError } = 
      await supabaseAdmin.auth.getUser(token);

    if (userError || !requestingUser) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check requesting user's role
    const { data: requestingPartnerUser } = await supabaseAdmin
      .from('partner_users')
      .select('role')
      .eq('auth_user_id', requestingUser.id)
      .single();

    const requestingRole = requestingPartnerUser?.role || 'viewer';
    const isSuperAdmin = requestingRole === 'sef_admin';
    const isAdmin = requestingRole === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Parse request body
    const { email, full_name, partner_id, role } = req.body;

    // Validation
    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full_name are required' });
    }

    // Role validation
    if (role === 'admin' && !isSuperAdmin) {
      return res.status(403).json({ error: 'Only superadmins can create admin users' });
    }

    if (role === 'partner' && !partner_id) {
      return res.status(400).json({ error: 'partner_id is required for partner users' });
    }

    // Generate temporary password
    const temporaryPassword = 'SEF!' + nanoid(10);

    // 1. Create auth user
    const { data: authUserData, error: authError } = 
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: role === 'admin' ? 'admin' : 'partner',
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authUserData?.user) {
      return res.status(500).json({ error: 'Failed to create auth user' });
    }

    // 2. Insert into partner_users
    const { data: partnerUser, error: partnerUserError } = 
      await supabaseAdmin
        .from('partner_users')
        .insert({
          auth_user_id: authUserData.user.id,
          partner_id: partner_id || null,
          email,
          full_name,
          role: role === 'admin' ? 'admin' : 'viewer',
        })
        .select()
        .single();

    if (partnerUserError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id);
      return res.status(400).json({ error: partnerUserError.message });
    }

    // 3. Generate recovery link
    const { data: recoveryLinkData, error: linkError } = 
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

    if (linkError) {
      console.error('Failed to generate recovery link:', linkError);
    }

    const recoveryLink = recoveryLinkData?.properties?.action_link || null;

    // 4. Log activity
    await supabaseAdmin.from('activity_log').insert({
      activity_type: 'user_created',
      user_email: requestingUser.email,
      target_user_email: email,
      description: `Created ${role} user: ${full_name} (${email})`,
      metadata: {
        role,
        partner_id: partner_id || null,
        created_by: requestingUser.id,
        auth_user_id: authUserData.user.id,
      },
    });

    // 5. Return success with email data
    return res.status(200).json({
      success: true,
      auth_user_id: authUserData.user.id,
      partner_user_id: partnerUser.id,
      recovery_link: recoveryLink,
      email_data: {
        to: email,
        subject: 'Welcome to SEF Partner Portal',
        recovery_link: recoveryLink,
        portal_url: 'https://portal.visitsef.com',
        support_email: 'partners@sheraa.ae',
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
}

