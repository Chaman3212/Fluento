import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transport;
export const mailConfigured = () => Boolean(env.SMTP_HOST);

export async function sendResetEmail(to, name, link) {
  if (!mailConfigured()) {
    // Never return the token to the client. Only the server operator sees this.
    logger.warn({ to }, 'SMTP not configured: password reset email NOT sent. Set SMTP_* env vars.');
    return false;
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: env.MAIL_FROM, to, subject: 'Reset your Fluento password',
    text: `Hi ${name},\n\nUse this link to reset your password (valid for 30 minutes):\n${link}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hi ${name},</p><p><a href="${link}">Reset your Fluento password</a> (valid for 30 minutes).</p><p>If you did not request this, ignore this email.</p>`,
  });
  return true;
}
