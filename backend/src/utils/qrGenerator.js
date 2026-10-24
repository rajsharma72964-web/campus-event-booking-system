// QR Code Generator Utility
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generates a unique, cryptographically random QR payload string.
 * Format: EVH-<bookingId>-<timestamp>-<random8chars>
 */
const generateQRPayload = (bookingId) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVH-${bookingId}-${timestamp}-${random}`;
};

/**
 * Converts a QR payload string into a base64 PNG Data URL.
 * @param {string} data - The string to encode in the QR code
 * @returns {Promise<string>} - Base64 data URL (data:image/png;base64,...)
 */
const generateQRCodeDataURL = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#0F172A',   // Slate-950 for dark cells
        light: '#FFFFFF',  // White background
      },
      width: 300,
    });
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
};

module.exports = { generateQRPayload, generateQRCodeDataURL };
