export interface MailEnvelope {
  uid: number;
  subject: string;
  from: string;
  date: string;
  flags: string[];
}

export interface MailMessage extends MailEnvelope {
  html?: string;
  text?: string;
}
