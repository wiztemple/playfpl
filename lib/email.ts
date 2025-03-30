// /lib/email.ts
import nodemailer from 'nodemailer';

// Configure email transporter
let transporter: nodemailer.Transporter;

// In development, use a test account or mock the email sending
if (process.env.NODE_ENV !== 'production') {
  // Create a preview service that doesn't actually send emails
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: 'test',
      pass: 'test'
    }
  });
} else {
  // In production, use real email service
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: process.env.NODE_ENV === 'production',
  });
}

export function generateVerificationCode() {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mock function that logs the code instead of sending an email in development
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@fplstakes.com',
    to: email,
    subject: 'Verify your FPL Stakes account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to FPL Stakes!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up. Please use the verification code below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(to right, #6366f1, #a855f7); color: white; padding: 12px 24px; font-size: 24px; font-weight: bold; letter-spacing: 4px; display: inline-block; border-radius: 4px;">
            ${code}
          </div>
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The FPL Stakes Team</p>
      </div>
    `,
  };

  if (process.env.NODE_ENV !== 'production') {
    // In development, log the code instead of sending an email
    console.log(`
      =============== VERIFICATION EMAIL ===============
      TO: ${email}
      SUBJECT: Verify your FPL Stakes account
      CODE: ${code}
      =================================================
    `);
    return Promise.resolve();
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw the error, just log it
  }
}