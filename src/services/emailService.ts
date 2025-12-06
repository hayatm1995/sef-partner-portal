/**
 * Email Service
 * Handles sending emails via Resend API
 * Uses Belong+ branding with purple/pink gradient
 */

import { Resend } from 'resend';

// Initialize Resend client
if (!import.meta.env.VITE_RESEND_API_KEY) {
  console.warn('VITE_RESEND_API_KEY missing. Email sending disabled.');
}

const resend = import.meta.env.VITE_RESEND_API_KEY ? new Resend(import.meta.env.VITE_RESEND_API_KEY) : null;

/**
 * Get the site URL from environment variables
 */
function getSiteUrl(): string {
  const siteUrl = import.meta.env.VITE_SITE_URL || import.meta.env.VITE_APP_URL || window.location.origin;
  return siteUrl.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Generate Belong+ branded HTML email template
 */
function generateBelongPlusEmailTemplate(params: {
  partnerName: string;
  magicLink: string;
}): string {
  const { partnerName, magicLink } = params;
  const siteUrl = getSiteUrl();

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
 * Send magic link invitation email to a partner
 * @param params - Email parameters
 * @returns Promise with success status
 */
export async function sendMagicLinkInvite(params: {
  email: string;
  partnerName: string;
  magicLink: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, partnerName, magicLink } = params;

  if (!resend) {
    return {
      success: false,
      error: 'Resend API key not configured. Please set VITE_RESEND_API_KEY in your environment variables.',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'SEF Partner Portal <noreply@sheraa.ae>', // Update with your verified domain
      to: email,
      subject: 'Welcome to SEF Partner Portal - Set Up Your Account',
      html: generateBelongPlusEmailTemplate({
        partnerName,
        magicLink,
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Magic link email sent successfully:', data);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error sending magic link email:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred while sending email',
    };
  }
}

/**
 * Send partner magic link invite email (reusable function)
 * Used by Edge Functions and client-side code
 */
export async function sendPartnerMagicInvite(
  name: string,
  email: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendMagicLinkInvite({
    email,
    partnerName: name,
    magicLink: magicLinkUrl,
  });
}

