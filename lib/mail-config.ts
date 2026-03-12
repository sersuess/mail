import type { ImapFlowOptions } from "imapflow";

export function getImapConfig(): ImapFlowOptions {
  return {
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    secure: true,
    auth: {
      user: process.env.IMAP_USER || "",
      pass: process.env.IMAP_PASS || "",
    },
    logger: false as const,
  };
}

export function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };
}
