import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DOMAIN = 'rana.fr';
const INBOX_TTL_MS = 60 * 60 * 1000; // 60 minutes
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'mailstore.json');

interface MailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentBase64?: string;
}

interface MailMessage {
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

interface InboxRecord {
  address: string;
  localPart: string;
  domain: 'rana.fr';
  createdAt: number;
  expiresAt: number;
}

interface StoreData {
  inboxes: Record<string, InboxRecord>;
  messages: Record<string, MailMessage[]>;
}

const RESERVED_ALIASES = new Set([
  'admin',
  'administrator',
  'postmaster',
  'hostmaster',
  'abuse',
  'security',
  'root',
  'support',
]);

const FIRST_NAMES = [
  'nabil',
  'sadia',
  'tarik',
  'araf',
  'farhan',
  'mehedi',
  'nusrat',
  'rafi',
  'tanvir',
  'lamia',
  'zayed',
  'tasnim',
  'ashik',
  'maliha',
  'rayhan',
  'ishrat',
];

const SUFFIX_WORDS = [
  'mail',
  'box',
  'desk',
  'hub',
  'note',
  'cloud',
  'post',
  'core',
];

let store: StoreData = { inboxes: {}, messages: {} };
const sseClients = new Map<string, Set<express.Response>>();

function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed && typeof parsed === 'object') {
        store = {
          inboxes: parsed.inboxes ?? {},
          messages: parsed.messages ?? {},
        };
      }
    }
  } catch (err) {
    console.error('Failed to load mailstore:', err);
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf-8');
    } catch (err) {
      console.error('Failed to persist mailstore:', err);
    }
  }, 300);
}

function purgeExpiredInboxes() {
  const now = Date.now();
  let changed = false;
  for (const [addr, inbox] of Object.entries(store.inboxes)) {
    if (inbox.expiresAt < now) {
      delete store.inboxes[addr];
      delete store.messages[addr];
      changed = true;
    }
  }
  if (changed) scheduleSave();
}

function normalizeAddress(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.includes('@')) {
    return cleaned;
  }
  return `${cleaned}@${DOMAIN}`;
}

function isValidLocalPart(local: string): boolean {
  if (local.length < 3 || local.length > 32) return false;
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(local)) return false;
  if (/\.\./.test(local)) return false;
  if (RESERVED_ALIASES.has(local)) return false;
  return true;
}

function generateRandomLocalPart(): string {
  const name = FIRST_NAMES[crypto.randomInt(0, FIRST_NAMES.length)];
  const word = SUFFIX_WORDS[crypto.randomInt(0, SUFFIX_WORDS.length)];
  const num = crypto.randomInt(100, 999);
  return `${name}.${word}${num}`;
}

function extractOtp(subject: string, text: string, html = ''): string | null {
  const cleanHtml = html ? stripHtmlToText(html) : '';
  const combined = `${subject}\n${text}\n${cleanHtml}`;

  const prefixed = combined.match(/\b(?:FB|G|TG|WA|OTP)[-\s]?(\d{5,8})\b/i);
  if (prefixed?.[1]) return prefixed[1];

  const kwBefore = combined.match(
    /(?:code|otp|pin|confirm|confirmation|verification|verify|passcode|token|security|login|auth|কোড|পিন|ভেরিফিকেশন|নিশ্চিতকরণ)[^\d]{0,40}\b(\d{4,8})\b/i
  );
  if (kwBefore?.[1]) return kwBefore[1];

  const codeBeforeKw = combined.match(
    /\b(\d{4,8})\b[^\d\n]{1,40}(?:is your|your|হলো|আপনার|code|otp|pin|confirmation|verification|কোড)/i
  );
  if (codeBeforeKw?.[1]) return codeBeforeKw[1];

  const standalone = combined.match(/(?:^|\s)(\d{5,6})(?:\s|$)/m);
  return standalone?.[1] ?? null;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeRfc2047(input: string): string {
  return input.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_m, _charset, enc, payload) => {
    try {
      if (enc.toUpperCase() === 'B') {
        return Buffer.from(payload, 'base64').toString('utf-8');
      }
      const qp = payload
        .replace(/_/g, ' ')
        .replace(/=([0-9A-Fa-f]{2})/g, (_h: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16))
        );
      return Buffer.from(qp, 'latin1').toString('utf-8');
    } catch {
      return payload;
    }
  });
}

function decodeQuotedPrintable(input: string): string {
  const unfolded = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < unfolded.length; i++) {
    if (unfolded[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(i + 1, i + 3))) {
      bytes.push(parseInt(unfolded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(unfolded.charCodeAt(i));
    }
  }
  return Buffer.from(bytes).toString('utf-8');
}

function decodeMimeBody(rawBody: string, encoding: string): string {
  const enc = encoding.trim().toLowerCase();
  if (enc === 'base64') {
    try {
      return Buffer.from(rawBody.replace(/\s+/g, ''), 'base64').toString('utf-8');
    } catch {
      return rawBody;
    }
  }
  if (enc === 'quoted-printable') {
    return decodeQuotedPrintable(rawBody);
  }
  return rawBody;
}

function splitHeadersAndBody(raw: string): { headers: Record<string, string>; body: string } {
  const sep = raw.match(/\r?\n\r?\n/);
  if (!sep || sep.index === undefined) {
    return { headers: {}, body: raw };
  }
  const headerBlock = raw.slice(0, sep.index).replace(/\r?\n[ \t]+/g, ' ');
  const body = raw.slice(sep.index + sep[0].length);
  const headers: Record<string, string> = {};
  for (const line of headerBlock.split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim();
      const val = decodeRfc2047(line.slice(colon + 1).trim());
      headers[key.toLowerCase()] = val;
    }
  }
  return { headers, body };
}

function extractMimeParts(rawPart: string, out: { text: string; html: string }) {
  const { headers, body } = splitHeadersAndBody(rawPart);
  const contentType = headers['content-type'] ?? 'text/plain';
  const transferEnc = headers['content-transfer-encoding'] ?? '7bit';

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (/multipart\//i.test(contentType) && boundaryMatch) {
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const chunks = body.split(new RegExp(`--${escaped}(?:--)?\\r?\\n?`));
    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (!trimmed || trimmed === '--') continue;
      extractMimeParts(chunk.replace(/^\r?\n/, ''), out);
    }
    return;
  }

  const decoded = decodeMimeBody(body, transferEnc);
  if (/text\/html/i.test(contentType)) {
    if (!out.html) out.html = decoded;
  } else if (/text\/plain/i.test(contentType) || !contentType) {
    if (!out.text) out.text = decoded;
  }
}

function parseRawMimeEmail(rawMime: string): {
  to?: string;
  from?: string;
  subject?: string;
  text: string;
  html: string;
  headers: Record<string, string>;
} {
  const { headers } = splitHeadersAndBody(rawMime);
  const out = { text: '', html: '' };
  extractMimeParts(rawMime, out);
  return {
    to: headers['to'] || headers['delivered-to'],
    from: headers['from'],
    subject: headers['subject'],
    text: out.text,
    html: out.html,
    headers,
  };
}

function ensureInbox(address: string): InboxRecord {
  const normalized = normalizeAddress(address);
  const [localPart] = normalized.split('@');
  const now = Date.now();
  if (!store.inboxes[normalized]) {
    store.inboxes[normalized] = {
      address: normalized,
      localPart,
      domain: DOMAIN,
      createdAt: now,
      expiresAt: now + INBOX_TTL_MS,
    };
    store.messages[normalized] = store.messages[normalized] ?? [];
    scheduleSave();
  }
  return store.inboxes[normalized];
}

function broadcastEvent(address: string, eventName: string, payload: unknown) {
  const clients = sseClients.get(address);
  if (!clients || clients.size === 0) return;
  const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(serialized);
  }
}

function createWelcomeMessage(toAddress: string): MailMessage {
  const otp = String(crypto.randomInt(100000, 999999));
  const now = Date.now();
  const text = `আপনার অস্থায়ী ইনবক্স ${toAddress} এখন সক্রিয়।\n\nনমুনা ভেরিফিকেশন কোড: ${otp}\n\nযেকোনো সাইটে সাইনআপ করতে এই ঠিকানা কপি করুন অথবা উপরের "টেস্ট মেইল পাঠান" বাটন ব্যবহার করে লাইভ মেইল যাচাই করুন।`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700;">rana.fr ইনবক্স প্রস্তুত</h2>
      <p style="margin: 0 0 16px; color: #475569;">আপনার অস্থায়ী ইমেইল ঠিকানা <strong style="font-family: monospace; color: #0f172a;">${toAddress}</strong> এখন লাইভ মেইল গ্রহণের জন্য সক্রিয় আছে।</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">নমুনা ভেরিফিকেশন কোড (OTP)</div>
        <div style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.14em; color: #2563eb;">${otp}</div>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">ইনবক্সটি ৬০ মিনিট সক্রিয় থাকবে। যেকোনো সময় মেয়াদ বাড়াতে বা নতুন ঠিকানা নিতে পারবেন।</p>
    </div>
  `;

  return {
    id: crypto.randomUUID(),
    to: toAddress,
    from: 'noreply@rana.fr',
    fromName: 'rana.fr Mail Desk',
    subject: `স্বাগতম — আপনার ইনবক্স সক্রিয় (কোড: ${otp})`,
    text,
    html,
    headers: {
      'Message-ID': `<${crypto.randomUUID()}@rana.fr>`,
      From: 'rana.fr Mail Desk <noreply@rana.fr>',
      To: toAddress,
      Date: new Date(now).toUTCString(),
      'Content-Type': 'text/html; charset=UTF-8',
      'X-Mailer': 'rana.fr Inbound Relay',
    },
    attachments: [],
    receivedAt: now,
    read: false,
    detectedOtp: otp,
  };
}

function buildPresetMessage(
  toAddress: string,
  preset: 'otp' | 'otp5' | 'welcome' | 'invoice' | 'custom',
  custom?: { fromName?: string; from?: string; subject?: string; text?: string }
): MailMessage {
  const now = Date.now();
  const otp5 = String(crypto.randomInt(10000, 99999));
  const otp = String(crypto.randomInt(100000, 999999));

  if (preset === 'otp5') {
    return {
      id: crypto.randomUUID(),
      to: toAddress,
      from: 'security@socialmail.example',
      fromName: 'Social Account Security',
      subject: `${otp5} is your confirmation code`,
      text: `Hi,\n\n${otp5} is your confirmation code for ${toAddress}.\nOr enter FB-${otp5} to confirm your account.`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 520px;">
          <h2 style="margin: 0 0 10px;">Account Confirmation Code</h2>
          <p style="margin: 0 0 14px; color: #475569;">Use the 5-digit confirmation code below for <strong>${toAddress}</strong>:</p>
          <div style="background: #f1f5f9; padding: 14px 20px; border-radius: 8px; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.16em; color: #0f172a; display: inline-block;">FB-${otp5}</div>
          <p style="margin: 14px 0 0; font-size: 13px; color: #64748b;">${otp5} is your 5-digit verification code.</p>
        </div>
      `,
      headers: {
        'Message-ID': `<${crypto.randomUUID()}@socialmail.example>`,
        From: 'Social Account Security <security@socialmail.example>',
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [],
      receivedAt: now,
      read: false,
      detectedOtp: otp5,
    };
  }

  if (preset === 'custom') {
    const from = (custom?.from || 'sender@example.com').trim();
    const fromName = (custom?.fromName || 'Custom Sender').trim();
    const subject = (custom?.subject || 'Test Message for @rana.fr').trim();
    const text = (custom?.text || `Hello ${toAddress},\n\nYour code is ${otp}.`).trim();
    const escapedHtml = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    return {
      id: crypto.randomUUID(),
      to: toAddress,
      from,
      fromName,
      subject,
      text,
      html: `<div style="font-family: system-ui, sans-serif; line-height: 1.6;">${escapedHtml}</div>`,
      headers: {
        'Message-ID': `<${crypto.randomUUID()}@rana.fr>`,
        From: `${fromName} <${from}>`,
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [],
      receivedAt: now,
      read: false,
      detectedOtp: extractOtp(subject, text),
    };
  }

  if (preset === 'welcome') {
    return {
      id: crypto.randomUUID(),
      to: toAddress,
      from: 'accounts@cloudstack.example',
      fromName: 'CloudStack Accounts',
      subject: 'Confirm your CloudStack account email',
      text: `Hi there,\n\nPlease confirm ${toAddress} by clicking the verification link below:\nhttps://cloudstack.example/verify?token=${crypto.randomBytes(12).toString('hex')}\n\nOr enter verification code: ${otp}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 540px;">
          <h2 style="margin: 0 0 12px;">Confirm your email address</h2>
          <p>Click the button below to verify <strong>${toAddress}</strong> for your new workspace.</p>
          <p style="margin: 20px 0;">
            <a href="https://cloudstack.example/verify?token=${crypto.randomBytes(8).toString('hex')}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
          </p>
          <p style="color: #64748b; font-size: 13px;">Backup verification code: <strong style="font-family: monospace; color: #0f172a;">${otp}</strong></p>
        </div>
      `,
      headers: {
        'Message-ID': `<${crypto.randomUUID()}@cloudstack.example>`,
        From: 'CloudStack Accounts <accounts@cloudstack.example>',
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [],
      receivedAt: now,
      read: false,
      detectedOtp: otp,
    };
  }

  if (preset === 'invoice') {
    const invoiceNo = `INV-${crypto.randomInt(10000, 99999)}`;
    return {
      id: crypto.randomUUID(),
      to: toAddress,
      from: 'billing@nordicpay.example',
      fromName: 'NordicPay Billing',
      subject: `Receipt for your payment (${invoiceNo})`,
      text: `Payment confirmation for ${toAddress}\nInvoice: ${invoiceNo}\nAmount: €29.00\nStatus: Paid`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 540px;">
          <h2 style="margin: 0 0 8px;">Payment Receipt</h2>
          <p style="color: #64748b; margin: 0 0 16px;">Invoice #${invoiceNo} · Paid</p>
          <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">Pro Workspace Plan</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">€29.00</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Total Paid</td><td style="padding: 10px 0; text-align: right; font-weight: 700; font-family: monospace;">€29.00</td></tr>
          </table>
        </div>
      `,
      headers: {
        'Message-ID': `<${crypto.randomUUID()}@nordicpay.example>`,
        From: 'NordicPay Billing <billing@nordicpay.example>',
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [
        {
          filename: `${invoiceNo}.txt`,
          contentType: 'text/plain',
          size: 148,
          contentBase64: Buffer.from(
            `Invoice: ${invoiceNo}\nRecipient: ${toAddress}\nAmount: EUR 29.00\nStatus: PAID\nDate: ${new Date(now).toISOString()}\n`
          ).toString('base64'),
        },
      ],
      receivedAt: now,
      read: false,
      detectedOtp: null,
    };
  }

  return {
    id: crypto.randomUUID(),
    to: toAddress,
    from: 'security@authguard.example',
    fromName: 'AuthGuard Verification',
    subject: `Your login verification code is ${otp}`,
    text: `Use verification code ${otp} to complete sign-in for ${toAddress}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px;">
        <h2 style="margin: 0 0 10px;">Sign-in Verification</h2>
        <p style="margin: 0 0 16px; color: #475569;">Enter the 6-digit code below to verify your session for <strong>${toAddress}</strong>:</p>
        <div style="background: #f1f5f9; padding: 16px 20px; border-radius: 8px; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.16em; color: #0f172a; display: inline-block;">${otp}</div>
        <p style="margin: 16px 0 0; font-size: 13px; color: #64748b;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
    headers: {
      'Message-ID': `<${crypto.randomUUID()}@authguard.example>`,
      From: 'AuthGuard Verification <security@authguard.example>',
      To: toAddress,
      Date: new Date(now).toUTCString(),
      'Content-Type': 'text/html; charset=UTF-8',
    },
    attachments: [],
    receivedAt: now,
    read: false,
    detectedOtp: otp,
  };
}

async function startServer() {
  loadStore();
  setInterval(purgeExpiredInboxes, 60_000);

  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, domain: DOMAIN, activeInboxes: Object.keys(store.inboxes).length });
  });

  // Create random or custom @rana.fr inbox
  app.post('/api/inboxes', (req, res) => {
    purgeExpiredInboxes();
    const { localPart: requestedLocal, seedWelcome } = req.body ?? {};
    let localPart = '';

    if (typeof requestedLocal === 'string' && requestedLocal.trim().length > 0) {
      localPart = requestedLocal.trim().toLowerCase().replace(/@rana\.fr$/i, '');
      if (!isValidLocalPart(localPart)) {
        res.status(400).json({ error: 'invalid_alias' });
        return;
      }
    } else {
      do {
        localPart = generateRandomLocalPart();
      } while (store.inboxes[`${localPart}@${DOMAIN}`]);
    }

    const address = `${localPart}@${DOMAIN}`;
    const existing = store.inboxes[address];
    const now = Date.now();
    const inbox: InboxRecord = existing
      ? { ...existing, expiresAt: Math.max(existing.expiresAt, now + INBOX_TTL_MS) }
      : {
          address,
          localPart,
          domain: DOMAIN,
          createdAt: now,
          expiresAt: now + INBOX_TTL_MS,
        };

    store.inboxes[address] = inbox;
    if (!store.messages[address]) {
      store.messages[address] = [];
      if (seedWelcome) {
        store.messages[address].push(createWelcomeMessage(address));
      }
    }
    scheduleSave();

    res.status(201).json({
      inbox,
      messages: store.messages[address],
    });
  });

  // Get inbox and messages (auto-provisions valid @rana.fr alias)
  app.get('/api/inboxes/:address', (req, res) => {
    purgeExpiredInboxes();
    const address = normalizeAddress(req.params.address);
    const [local, dom] = address.split('@');
    if (dom !== DOMAIN || !isValidLocalPart(local)) {
      res.status(400).json({ error: 'invalid_address' });
      return;
    }
    const inbox = ensureInbox(address);
    const messages = store.messages[address] ?? [];
    res.json({ inbox, messages });
  });

  // Extend inbox TTL by 60 minutes
  app.post('/api/inboxes/:address/extend', (req, res) => {
    const address = normalizeAddress(req.params.address);
    const inbox = ensureInbox(address);
    inbox.expiresAt = Date.now() + INBOX_TTL_MS;
    store.inboxes[address] = inbox;
    scheduleSave();
    res.json({ inbox });
  });

  // Burn/delete inbox
  app.delete('/api/inboxes/:address', (req, res) => {
    const address = normalizeAddress(req.params.address);
    delete store.inboxes[address];
    delete store.messages[address];
    scheduleSave();
    broadcastEvent(address, 'inbox_burned', { address });
    res.json({ ok: true });
  });

  // Mark message as read
  app.patch('/api/messages/:id/read', (req, res) => {
    const { id } = req.params;
    for (const [address, msgs] of Object.entries(store.messages)) {
      const msg = msgs.find((m) => m.id === id);
      if (msg) {
        msg.read = true;
        scheduleSave();
        res.json({ ok: true, address });
        return;
      }
    }
    res.status(404).json({ error: 'not_found' });
  });

  // Delete single message
  app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    for (const [address, msgs] of Object.entries(store.messages)) {
      const idx = msgs.findIndex((m) => m.id === id);
      if (idx !== -1) {
        msgs.splice(idx, 1);
        scheduleSave();
        broadcastEvent(address, 'message_deleted', { id });
        res.json({ ok: true });
        return;
      }
    }
    res.status(404).json({ error: 'not_found' });
  });

  // Download RFC 5322 .eml file
  app.get('/api/messages/:id/eml', (req, res) => {
    const { id } = req.params;
    for (const msgs of Object.values(store.messages)) {
      const msg = msgs.find((m) => m.id === id);
      if (msg) {
        const headerLines = Object.entries(msg.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n');
        const emlContent = `${headerLines}\r\nSubject: ${msg.subject}\r\n\r\n${msg.html || msg.text}`;
        res.setHeader('Content-Type', 'message/rfc822; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="rana-fr-${msg.id.slice(0, 8)}.eml"`);
        res.send(emlContent);
        return;
      }
    }
    res.status(404).json({ error: 'not_found' });
  });

  // Send preset or custom test message to an inbox
  app.post('/api/inboxes/:address/simulate', (req, res) => {
    const address = normalizeAddress(req.params.address);
    const [local, dom] = address.split('@');
    if (dom !== DOMAIN || !isValidLocalPart(local)) {
      res.status(400).json({ error: 'invalid_address' });
      return;
    }
    ensureInbox(address);
    const { preset = 'otp', fromName, from, subject, text } = req.body ?? {};
    const msg = buildPresetMessage(address, preset, { fromName, from, subject, text });
    store.messages[address] = [msg, ...(store.messages[address] ?? [])].slice(0, 100);
    scheduleSave();
    broadcastEvent(address, 'new_message', msg);
    res.status(201).json({ message: msg });
  });

  // Real Inbound Webhook Endpoint (supports Cloudflare Email Routing Worker raw MIME / Mailgun / Postmark / SendGrid / JSON POST)
  app.post('/api/inbound', (req, res) => {
    const configuredSecret = process.env.INBOUND_WEBHOOK_SECRET?.trim();
    if (configuredSecret) {
      const provided = String(req.headers['x-webhook-secret'] ?? req.body?.secret ?? '');
      if (provided !== configuredSecret) {
        res.status(401).json({ error: 'Invalid webhook secret' });
        return;
      }
    }

    const body = req.body ?? {};
    const parsedMime = typeof body.raw === 'string' && body.raw.trim().length > 0
      ? parseRawMimeEmail(body.raw)
      : null;

    const toRaw = body.to ?? body.To ?? body.recipient ?? body.envelopeTo ?? parsedMime?.to ?? '';
    const fromRaw =
      body.from ?? body.From ?? body.sender ?? parsedMime?.from ?? 'external@sender.com';
    const fromName = body.fromName ?? '';
    const subject = body.subject ?? body.Subject ?? parsedMime?.subject ?? '(No subject)';
    const text =
      body.text ??
      body.TextBody ??
      body['body-plain'] ??
      body['stripped-text'] ??
      parsedMime?.text ??
      '';
    const html =
      body.html ?? body.HtmlBody ?? body['body-html'] ?? parsedMime?.html ?? '';
    const headers = {
      ...(parsedMime?.headers ?? {}),
      ...(body.headers && typeof body.headers === 'object' ? body.headers : {}),
    };
    const attachments = body.attachments ?? [];

    if (!toRaw || typeof toRaw !== 'string') {
      res.status(400).json({ error: 'Missing recipient "to" address' });
      return;
    }

    // Handle "Name <alias@rana.fr>" or plain "alias@rana.fr"
    const emailMatch = toRaw.match(/([a-zA-Z0-9._-]+@rana\.fr)/i);
    const normalizedTo = (emailMatch?.[1] ?? toRaw).trim().toLowerCase();
    const [local, dom] = normalizedTo.split('@');

    if (dom !== DOMAIN || !isValidLocalPart(local)) {
      res.status(400).json({ error: `Recipient must be a valid @${DOMAIN} address` });
      return;
    }

    ensureInbox(normalizedTo);
    const now = Date.now();
    const plainText = String(text || (html ? stripHtmlToText(String(html)) : ''));
    const htmlBody =
      String(html || '') ||
      `<div style="font-family: system-ui, sans-serif; line-height: 1.6;">${plainText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>')}</div>`;

    const fromStr = String(fromRaw);
    const parsedFromEmail = (fromStr.match(/<([^>]+)>/)?.[1] ?? fromStr).trim();
    const parsedFromName =
      String(fromName) ||
      fromStr.replace(/<[^>]+>/, '').replace(/"/g, '').trim() ||
      parsedFromEmail.split('@')[0];

    const message: MailMessage = {
      id: crypto.randomUUID(),
      to: normalizedTo,
      from: parsedFromEmail,
      fromName: parsedFromName,
      subject: String(subject),
      text: plainText,
      html: htmlBody,
      headers: {
        'Message-ID': `<${crypto.randomUUID()}@rana.fr>`,
        From: `${parsedFromName} <${parsedFromEmail}>`,
        To: normalizedTo,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
        ...headers,
      },
      attachments: Array.isArray(attachments) ? attachments : [],
      receivedAt: now,
      read: false,
      detectedOtp: extractOtp(String(subject), plainText, htmlBody),
    };

    store.messages[normalizedTo] = [message, ...(store.messages[normalizedTo] ?? [])].slice(0, 100);
    scheduleSave();
    broadcastEvent(normalizedTo, 'new_message', message);

    res.status(201).json({
      ok: true,
      id: message.id,
      to: normalizedTo,
      detectedOtp: message.detectedOtp,
    });
  });

  // Real-time Server-Sent Events stream for an inbox
  app.get('/api/events/:address', (req, res) => {
    const address = normalizeAddress(req.params.address);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!sseClients.has(address)) {
      sseClients.set(address, new Set());
    }
    sseClients.get(address)!.add(res);
    res.write(`event: connected\ndata: ${JSON.stringify({ address })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.get(address)?.delete(res);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`rana.fr temp mail server running on http://localhost:${PORT}`);
  });
}

startServer();
