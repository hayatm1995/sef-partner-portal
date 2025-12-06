// Supabase Edge Function: admin-create-user
// Deploy with: supabase functions deploy admin-create-user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is admin/superadmin
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get requesting user's role from partner_users
    const { data: requestingPartnerUser } = await supabaseAdmin
      .from("partner_users")
      .select("role")
      .eq("auth_user_id", requestingUser.id)
      .single();

    const requestingRole = requestingPartnerUser?.role || "viewer";
    const isSuperAdmin = requestingRole === "sef_admin";
    const isAdmin = requestingRole === "admin" || isSuperAdmin;

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { email, full_name, partner_id, role } = await req.json();

    // Validation
    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email and full_name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Role validation
    if (role === "admin" && !isSuperAdmin) {
      return new Response(
        JSON.stringify({
          error: "Only superadmins can create admin users",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (role === "partner" && !partner_id) {
      return new Response(
        JSON.stringify({
          error: "partner_id is required for partner users",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate temporary password
    const temporaryPassword = "SEF!" + nanoid(10);

    // 1. Create auth user
    const { data: authUserData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: role === "admin" ? "admin" : "partner",
        },
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!authUserData?.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create auth user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Insert into partner_users table
    const { data: partnerUser, error: partnerUserError } =
      await supabaseAdmin.from("partner_users").insert({
        auth_user_id: authUserData.user.id,
        partner_id: partner_id || null,
        email,
        full_name,
        role: role === "admin" ? "admin" : "viewer",
      }).select().single();

    if (partnerUserError) {
      // Rollback: delete auth user if partner_user insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id);
      return new Response(
        JSON.stringify({ error: partnerUserError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Generate recovery link for onboarding email
    const { data: recoveryLinkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

    if (linkError) {
      console.error("Failed to generate recovery link:", linkError);
    }

    const recoveryLink =
      recoveryLinkData?.properties?.action_link || null;

    // 4. Log activity
    await supabaseAdmin.from("activity_log").insert({
      activity_type: "user_created",
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

    // 5. Send onboarding email (you'll need to integrate with your email service)
    // For now, we'll return the email data so the frontend can send it
    // Or integrate with Resend, SendGrid, etc. here

    return new Response(
      JSON.stringify({
        success: true,
        auth_user_id: authUserData.user.id,
        partner_user_id: partnerUser.id,
        recovery_link: recoveryLink,
        temporary_password: temporaryPassword, // Only return in development
        email_data: {
          to: email,
          subject: "Welcome to SEF Partner Portal",
          recovery_link: recoveryLink,
          portal_url: "https://portal.visitsef.com",
          support_email: "partners@sheraa.ae",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

