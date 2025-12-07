/**
 * Branded Email Templates
 * 
 * HTML email templates with SEF branding (orange #F47B20, purple #4A1B85, white bg)
 * Used for magic link login, partner invites, and admin invites.
 */

export interface EmailTemplateParams {
  name: string;
  magicLink: string;
  siteUrl?: string;
  supportEmail?: string;
}

/**
 * Generate branded HTML email template
 * Base template with SEF colors and styling
 */
function generateBaseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                ${title}
              </h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                SEF Partner Portal
              </p>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
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
 * Generate magic link login email
 */
export function generateMagicLinkEmail(params: EmailTemplateParams): string {
  const { name, magicLink, siteUrl = 'https://portal.visitsef.com' } = params;
  
  const content = `
    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
      Hello ${name || 'User'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      You've requested a secure login link for the SEF Partner Portal. Click the button below to access your dashboard:
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
      This link will expire in 24 hours. If you didn't request this login link, please ignore this email.
    </p>
  `;
  
  return generateBaseTemplate(content, 'Secure Login Link');
}

/**
 * Generate partner invite email
 */
export function generatePartnerInviteEmail(params: EmailTemplateParams): string {
  const { name, magicLink, siteUrl = 'https://portal.visitsef.com', supportEmail = 'partners@sheraa.ae' } = params;
  
  const content = `
    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
      Hello ${name || 'Partner'},
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
  `;
  
  return generateBaseTemplate(content, 'Welcome to SEF Partner Portal');
}

/**
 * Generate admin invite email
 */
export function generateAdminInviteEmail(params: EmailTemplateParams): string {
  const { name, magicLink, siteUrl = 'https://portal.visitsef.com' } = params;
  
  const content = `
    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
      Hello ${name || 'Admin'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      You've been granted admin access to the SEF Partner Portal. As an admin, you can manage partners, review submissions, and oversee the partnership program.
    </p>
    
    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
      Click the button below to set up your account and access the admin dashboard:
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
  `;
  
  return generateBaseTemplate(content, 'Admin Access - SEF Partner Portal');
}

