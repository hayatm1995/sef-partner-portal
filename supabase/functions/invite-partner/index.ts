// Supabase Edge Function: invite-partner
// Deploy with: supabase functions deploy invite-partner
// 
// This function:
// 1. Validates admin authentication
// 2. Creates a partner user in Supabase Auth
// 3. Generates a magic link
// 4. Sends invitation email via Resend with Belong+ branding

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate Belong+ branded HTML email template
 */
function generateBelongPlusEmailTemplate(
  partnerName: string,
  magicLink: string,
  siteUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SEF Partner Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient background -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to SEF Partner Portal
              </h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Belong+ Partnership Program
              </p>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello ${partnerName || 'Partner'},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                You've been invited to join the SEF Partner Portal! This is your gateway to manage your partnership, submit deliverables, track your progress, and connect with the SEF team.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Click the button below to set up your account and access the portal:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                      Access Partner Portal
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; color: #8B5CF6; font-size: 13px; line-height: 1.5; word-break: break-all;">
                ${magicLink}
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                This link will expire in 24 hours. If you didn't request this invitation, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                      SEF Partner Portal
                    </p>
                    <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                      Powered by Sheraa
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                      Need help? Contact us at
                    </p>
                    <p style="margin: 0; color: #8B5CF6; font-size: 12px; font-weight: 600;">
                      partners@sheraa.ae
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send email via Resend API
 */
async function sendResendEmail(
  email: string,
  partnerName: string,
  magicLink: string,
  resendApiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "SEF Partner Portal <noreply@sheraa.ae>",
        to: email,
        subject: "Welcome to SEF Partner Portal - Set Up Your Account",
        html: generateBelongPlusEmailTemplate(
          partnerName,
          magicLink,
          "https://portal.visitsef.com"
        ),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    const data = await response.json();
    console.log("✅ Email sent successfully:", data);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error?.message || "Unknown error occurred while sending email",
    };
  }
}

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
    const { email, name } = await req.json();

    // Validation
    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email and name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(
      email
    );

    if (existingUser?.user) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Create auth user with role="partner" and status="invited"
    const { data: authUserData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false, // User will confirm via magic link
        user_metadata: {
          role: "partner",
          status: "invited",
          name: name,
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
        partner_id: null, // Can be assigned later
        email,
        full_name: name,
        role: "partner",
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

    // 3. Generate magic link
    const siteUrl = Deno.env.get("VITE_SITE_URL") || "https://portal.visitsef.com";
    const { data: magicLinkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${siteUrl}/Login`,
        },
      });

    if (linkError || !magicLinkData?.properties?.action_link) {
      // Rollback: delete both auth user and partner_user
      await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const magicLink = magicLinkData.properties.action_link;

    // 4. Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // Don't fail - log warning but return success
      console.warn("RESEND_API_KEY not set - email not sent");
    } else {
      const emailResult = await sendResendEmail(
        email,
        name,
        magicLink,
        resendApiKey
      );

      if (!emailResult.success) {
        console.error("Failed to send email:", emailResult.error);
        // Don't fail the request - user was created, email can be resent later
      }
    }

    // 5. Log activity
    await supabaseAdmin.from("activity_log").insert({
      activity_type: "partner_invited",
      user_email: requestingUser.email,
      target_user_email: email,
      description: `Invited partner: ${name} (${email})`,
      metadata: {
        partner_user_id: partnerUser.id,
        auth_user_id: authUserData.user.id,
        invited_by: requestingUser.id,
      },
    });

    // 6. Return success
    return new Response(
      JSON.stringify({
        status: "invited",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

