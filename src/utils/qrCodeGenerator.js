/**
 * QR Code Generator Utility
 * Generates QR codes for VIP guest invitations
 */

/**
 * Generate a QR code data URL for a guest invitation
 * @param {string} invitationId - The invitation ID
 * @param {string} guestEmail - The guest email
 * @param {string} eventType - The event type
 * @returns {Promise<string>} - Data URL of the QR code image
 */
export async function generateQRCode(invitationId, guestEmail, eventType) {
  try {
    // Use a QR code API service (like qrcode.tec-it.com or similar)
    // For production, consider using a library like qrcode.js or qrcode.react
    const qrData = JSON.stringify({
      id: invitationId,
      email: guestEmail,
      event: eventType,
      timestamp: Date.now(),
    });

    // Encode the data
    const encodedData = encodeURIComponent(qrData);
    
    // Generate QR code using an API (free service)
    // Alternative: Use a client-side library like 'qrcode' npm package
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
    
    return qrUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code using a client-side library (if installed)
 * Requires: npm install qrcode
 */
export async function generateQRCodeLocal(data) {
  try {
    // Dynamic import to avoid bundling if not used
    const QRCode = await import('qrcode');
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code locally:', error);
    // Fallback to API
    return generateQRCode(data);
  }
}

/**
 * Generate a unique token for guest verification
 */
export function generateGuestToken(invitationId, guestEmail) {
  // In production, use a secure token generation method
  const token = btoa(`${invitationId}:${guestEmail}:${Date.now()}`);
  return token;
}

