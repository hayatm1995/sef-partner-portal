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
 * Generate SEF branded HTML email template
 * Uses SEF colors: #F47B20 (orange), #4A1B85 (purple), white bg
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
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #F47B20 0%, #4A1B85 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient background -->
          <tr>
            <td style="background: linear-gradient(135deg, #F47B20 0%, #4A1B85 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to the SEF Partner Hub
              </h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Your Partnership Portal
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
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #F47B20 0%, #4A1B85 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(244, 123, 32, 0.3);">
                      Access Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; color: #F47B20; font-size: 13px; line-height: 1.5; word-break: break-all;">
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
                      SEF TEAM
                    </p>
                    <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                      Sharjah Entrepreneurship Festival
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                      Need help? Contact us at
                    </p>
                    <p style="margin: 0; color: #F47B20; font-size: 12px; font-weight: 600;">
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
        from: "SEF TEAM <no-reply@sefpartners.vercel.app>",
        to: email,
        subject: "Your SEF Partner Hub Access",
        html: generateBelongPlusEmailTemplate(
          partnerName || name,
          magicLink,
          siteUrl || "https://sefpartners.vercel.app"
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
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables" 
        }),
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

    // Authorization validation
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get requesting user's role from partner_users table
    const { data: requestingPartnerUser, error: roleError } = await supabaseAdmin
      .from("partner_users")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    const requestingRole = requestingPartnerUser?.role;
    const isSuperAdmin = requestingRole === "superadmin" || requestingRole === "sef_admin";
    const isAdmin = requestingRole === "admin" || isSuperAdmin;

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestingUser = user;

    // Parse request body
    const { email, name, tier } = await req.json();

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
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserByEmail(
      email
    );

    let authUserData;
    let authUserId: string;

    if (existingAuthUser?.user) {
      // User already exists - use existing user
      authUserData = { user: existingAuthUser.user };
      authUserId = existingAuthUser.user.id;
    } else {
      // 1. Create auth user with role="partner" and status="invited"
      const { data: newAuthUserData, error: authError } =
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

      if (!newAuthUserData?.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create auth user" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authUserData = newAuthUserData;
      authUserId = newAuthUserData.user.id;
    }

    // 2. Create or get partner record
    // Use provided name or extract from email
    const companyName = name.includes('@') ? name.split('@')[0] : name;
    
    // Check if partner already exists (by primary_email or name)
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id, name")
      .or(`primary_email.eq.${email},name.ilike.%${companyName}%`)
      .limit(1)
      .maybeSingle();

    let partnerId: string | null = null;

    if (existingPartner?.id) {
      partnerId = existingPartner.id;
      // Update primary_email if not set
      if (!existingPartner.primary_email) {
        await supabaseAdmin
          .from("partners")
          .update({ primary_email: email })
          .eq("id", partnerId);
      }
    } else {
      // Create new partner record
      const { data: newPartner, error: partnerError } = await supabaseAdmin
        .from("partners")
        .insert({
          name: companyName,
          tier: tier || "Standard",
          contract_status: "Pending",
          primary_email: email,
          assigned_account_manager: requestingUser.email || null,
        })
        .select("id")
        .single();

      if (partnerError || !newPartner?.id) {
        // Rollback: delete auth user if partner creation fails (only if we created it)
        if (!existingAuthUser?.user) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        return new Response(
          JSON.stringify({ error: partnerError?.message || "Failed to create partner record" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      partnerId = newPartner.id;

      // 2a. Set up default partner_features for new partner
      const defaultFeatures = [
        'company_profile',
        'contacts',
        'media_assets',
        'sef_schedule',
        'deliverables',
        'nominations'
      ];

      const featureInserts = defaultFeatures.map(feature => ({
        partner_id: partnerId,
        feature: feature,
        enabled: true,
      }));

      const { error: featuresError } = await supabaseAdmin
        .from("partner_features")
        .insert(featureInserts);

      if (featuresError) {
        console.warn("Failed to create default partner_features:", featuresError);
        // Don't fail - features can be added later
      }
    }

    // 3. Check if partner_user already exists
    const { data: existingPartnerUser } = await supabaseAdmin
      .from("partner_users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    let partnerUser;
    if (existingPartnerUser?.id) {
      // Update existing partner_user to ensure correct partner_id
      const { data: updatedPartnerUser, error: updateError } = await supabaseAdmin
        .from("partner_users")
        .update({
          partner_id: partnerId,
          email,
          full_name: name,
          role: "partner",
        })
        .eq("id", existingPartnerUser.id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      partnerUser = updatedPartnerUser;
    } else {
      // Insert new partner_user
      const { data: newPartnerUser, error: partnerUserError } =
        await supabaseAdmin.from("partner_users").insert({
          auth_user_id: authUserId,
          partner_id: partnerId,
          email,
          full_name: name,
          role: "partner",
        }).select().single();

      if (partnerUserError) {
        // Rollback: delete auth user and partner if partner_user insert fails (only if we created them)
        if (!existingAuthUser?.user) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        if (partnerId && !existingPartner?.id) {
          // Only delete partner if we created it
          await supabaseAdmin.from("partners").delete().eq("id", partnerId);
        }
        return new Response(
          JSON.stringify({ error: partnerUserError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      partnerUser = newPartnerUser;
    }

    // 4. Generate magic link
    const siteUrl = Deno.env.get("VITE_SITE_URL") || Deno.env.get("SUPABASE_SITE_URL") || "https://sefpartners.vercel.app";
    const { data: magicLinkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${siteUrl}/partner`,
        },
      });

    if (linkError || !magicLinkData?.properties?.action_link) {
      // Don't rollback if user already existed - just return error
      if (!existingAuthUser?.user) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (partnerId && !existingPartner?.id) {
          await supabaseAdmin.from("partners").delete().eq("id", partnerId);
        }
        if (!existingPartnerUser?.id) {
          // partner_user was created, but we can't easily delete it without the ID
          // This is a rare edge case
        }
      }
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link: " + (linkError?.message || "Unknown error") }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const magicLink = magicLinkData.properties.action_link;

    // 5. Send email via Resend
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

    // 6. Log activity - get admin user_id from partner_users
    await supabaseAdmin.from("activity_log").insert({
      activity_type: "partner_invited",
      user_id: requestingPartnerUser?.id || null,
      partner_id: partnerId,
      description: `Invited partner: ${name} (${email})`,
      metadata: {
        partner_user_id: partnerUser.id,
        auth_user_id: authUserId,
        partner_id: partnerId,
        invited_by: requestingUser.id,
        invited_by_email: requestingUser.email,
        company_name: companyName,
        tier: tier || "Standard",
        is_new_user: !existingAuthUser?.user,
        is_new_partner: !existingPartner?.id,
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
    const errorMessage = error?.message || "Internal server error";
    const errorDetails = error?.details || error?.hint || "";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        type: error?.name || "UnknownError"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

