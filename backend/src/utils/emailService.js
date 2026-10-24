// Nodemailer Email Service — Booking Confirmation Dispatch
const nodemailer = require('nodemailer');

/**
 * Creates an SMTP transporter. If credentials are absent, falls back to
 * Nodemailer's built-in "preview" transport (logs to console in dev).
 */
const createTransporter = () => {
  const hasSmtpCredentials =
    process.env.SMTP_USER && process.env.SMTP_USER.trim() !== '' &&
    process.env.SMTP_PASS && process.env.SMTP_PASS.trim() !== '';

  if (hasSmtpCredentials) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: use Ethereal (auto-generated test account) or a fake transport
  console.warn(
    '[EmailService] SMTP credentials not configured. Emails will be logged to console only.'
  );
  return null;
};

/**
 * Builds the HTML body for a booking confirmation email.
 */
const buildTicketEmailHtml = ({ booking, event, user, qrCodeDataURL }) => {
  const eventDate = new Date(event.startDateTime).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const eventTime = new Date(event.startDateTime).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Event Ticket — ${event.title}</title>
</head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:32px;text-align:center;">
              <p style="margin:0 0 8px;color:#C7D2FE;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">EventHive</p>
              <h1 style="margin:0;color:#FFFFFF;font-size:26px;font-weight:800;">🎟 Booking Confirmed!</h1>
              <p style="margin:8px 0 0;color:#E0E7FF;font-size:14px;">Your ticket is ready. See you at the event!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#CBD5E1;font-size:15px;margin:0 0 24px;">
                Hi <strong style="color:#FFFFFF;">${user.name}</strong>, your reservation for
                <strong style="color:#818CF8;">${event.title}</strong> is confirmed.
              </p>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;border:1px solid #334155;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="6" cellspacing="0">
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;width:40%;">Event</td>
                        <td style="color:#FFFFFF;font-size:14px;font-weight:700;">${event.title}</td>
                      </tr>
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;">Category</td>
                        <td style="color:#A5B4FC;font-size:14px;">${event.category}</td>
                      </tr>
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;">Date</td>
                        <td style="color:#FFFFFF;font-size:14px;">${eventDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;">Time</td>
                        <td style="color:#FFFFFF;font-size:14px;">${eventTime}</td>
                      </tr>
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;">Venue</td>
                        <td style="color:#FFFFFF;font-size:14px;">${event.venue}</td>
                      </tr>
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;">Booking ID</td>
                        <td style="color:#34D399;font-size:12px;font-family:monospace;">${booking.id}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <div style="text-align:center;margin-bottom:28px;">
                <p style="color:#94A3B8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Entry QR Code</p>
                <img src="${qrCodeDataURL}" alt="Entry QR Code" width="200" height="200"
                  style="border-radius:12px;border:4px solid #4F46E5;display:block;margin:0 auto;" />
                <p style="color:#475569;font-size:11px;margin:12px 0 0;font-family:monospace;">${booking.qrCodeString}</p>
              </div>

              <p style="color:#64748B;font-size:12px;text-align:center;margin:0;">
                Present this QR code at the venue entrance for scanning.<br/>
                Do not share this ticket with others — it is unique to your booking.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;padding:20px;text-align:center;border-top:1px solid #1E293B;">
              <p style="color:#475569;font-size:11px;margin:0;">
                EventHive · Automated Confirmation · Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Sends a booking confirmation email with an embedded QR code.
 * Gracefully falls back to console logging if SMTP is unconfigured.
 *
 * @param {object} params
 * @param {object} params.booking  - Prisma Booking record
 * @param {object} params.event    - Prisma Event record (with organizer)
 * @param {object} params.user     - The user who booked
 * @param {string} params.qrCodeDataURL - base64 PNG data URL
 */
const sendBookingConfirmationEmail = async ({ booking, event, user, qrCodeDataURL }) => {
  const subject = `✅ Booking Confirmed — ${event.title}`;
  const html = buildTicketEmailHtml({ booking, event, user, qrCodeDataURL });

  const transporter = createTransporter();

  if (!transporter) {
    // Graceful fallback: log to console
    console.log('\n========== BOOKING CONFIRMATION EMAIL ==========');
    console.log(`TO: ${user.email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BOOKING ID: ${booking.id}`);
    console.log(`EVENT: ${event.title}`);
    console.log(`QR Payload: ${booking.qrCodeString}`);
    console.log('QR Code data URL omitted from console for brevity.');
    console.log('================================================\n');
    return { messageId: 'console-fallback', previewUrl: null };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"EventHive" <noreply@eventhive.campus>',
      to: user.email,
      subject,
      html,
      // Inline QR image as cid attachment as a secondary option
      attachments: [
        {
          filename: 'qr-ticket.png',
          content: qrCodeDataURL.split(',')[1], // strip "data:image/png;base64,"
          encoding: 'base64',
          cid: 'qrticket@eventhive',
        },
      ],
    });

    console.log(`[EmailService] Confirmation sent to ${user.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    // Log but don't crash the booking flow — email is supplementary
    console.error('[EmailService] Failed to send confirmation email:', err.message);
    return null;
  }
};

module.exports = { sendBookingConfirmationEmail };
