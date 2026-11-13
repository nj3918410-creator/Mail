export interface MailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentBase64?: string;
}

export interface MailMessage {
  id: string;
  to: string;
  from: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
  attachments: MailAttachment[];
  receivedAt: number;
  read: boolean;
  detectedOtp?: string | null;
}

export interface Inbox {
  address: string;
  localPart: string;
  domain: 'rana.fr';
  createdAt: number;
  expiresAt: number;
}

export type Language = 'bn' | 'en';

export type NavSection = 'inbox' | 'custom' | 'api' | 'guide';

export type MessageFilter = 'all' | 'unread' | 'otp';

export type ReaderTab = 'html' | 'text' | 'raw';

export type TestTemplateType = 'otp' | 'otp5' | 'welcome' | 'invoice' | 'custom';
