import nodemailer from "nodemailer";
import { getSmtpConfig } from "./mail-config";

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.auth,
  });

  const info = await transporter.sendMail({
    from: config.auth.user,
    to,
    subject,
    text: text || "",
    html: html || text || "",
  });

  return { messageId: info.messageId };
}
