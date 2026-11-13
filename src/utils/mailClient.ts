import type { Inbox, MailMessage, TestTemplateType } from '../types/mail';
import { extractOtpCode } from './otp';

const DOMAIN = 'rana.fr' as const;
const INBOX_TTL_MS = 60 * 60 * 1000;
const STATIC_STORE_KEY = 'rana_fr_static_store_v1';
const CHANNEL_NAME = 'rana_fr_mail_events';

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

const SUFFIX_WORDS = ['mail', 'box', 'desk', 'hub', 'note', 'cloud', 'post', 'core'];

interface StaticStore {
  inboxes: Record<string, Inbox>;
  messages: Record<string, MailMessage[]>;
}

let backendAvailablePromise: Promise<boolean> | null = null;

export async function isBackendAvailable(): Promise<boolean> {
  if (backendAvailablePromise) return backendAvailablePromise;
  backendAvailablePromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    try {
      const res = await fetch('/api/health', { signal: controller.signal });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data && data.ok === true);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  })();
  return backendAvailablePromise;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomDigits(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

function normalizeAddress(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  return cleaned.includes('@') ? cleaned : `${cleaned}@${DOMAIN}`;
}

function isValidLocalPart(local: string): boolean {
  if (local.length < 3 || local.length > 32) return false;
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(local)) return false;
  if (/\.\./.test(local)) return false;
  if (RESERVED_ALIASES.has(local)) return false;
  return true;
}

function generateRandomLocalPart(): string {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const word = SUFFIX_WORDS[Math.floor(Math.random() * SUFFIX_WORDS.length)];
  const num = 100 + Math.floor(Math.random() * 899);
  return `${name}.${word}${num}`;
}

function readStaticStore(): StaticStore {
  try {
    const raw = localStorage.getItem(STATIC_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StaticStore;
      const now = Date.now();
      const inboxes: Record<string, Inbox> = {};
      const messages: Record<string, MailMessage[]> = {};
      for (const [addr, inbox] of Object.entries(parsed.inboxes ?? {})) {
        if (inbox.expiresAt > now) {
          inboxes[addr] = inbox;
          messages[addr] = parsed.messages?.[addr] ?? [];
        }
      }
      return { inboxes, messages };
    }
  } catch {
    // Ignore corrupt localStorage
  }
  return { inboxes: {}, messages: {} };
}

function writeStaticStore(store: StaticStore) {
  try {
    localStorage.setItem(STATIC_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

function postStaticEvent(address: string, type: string, payload: unknown) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage({ address, type, payload });
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel errors
  }
}

function buildStaticWelcomeMessage(toAddress: string): MailMessage {
  const otp = randomDigits(6);
  const now = Date.now();
  const text = `আপনার অস্থায়ী ইনবক্স ${toAddress} এখন সক্রিয়।\n\nনমুনা ভেরিফিকেশন কোড: ${otp}\n\nযেকোনো সাইটে সাইনআপ করতে এই ঠিকানা কপি করুন অথবা উপরের "টেস্ট মেইল পাঠান" বাটন ব্যবহার করে লাইভ মেইল যাচাই করুন।`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700;">rana.fr ইনবক্স প্রস্তুত</h2>
      <p style="margin: 0 0 16px; color: #475569;">আপনার অস্থায়ী ইমেইল ঠিকানা <strong style="font-family: monospace; color: #0f172a;">${toAddress}</strong> এখন সক্রিয় আছে।</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">নমুনা ভেরিফিকেশন কোড (OTP)</div>
        <div style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.14em; color: #2563eb;">${otp}</div>
      </div>
      <p style="margin: 0; font-size: 13px; color: #64748b;">ইনবক্সটি ৬০ মিনিট সক্রিয় থাকবে। যেকোনো সময় মেয়াদ বাড়াতে বা নতুন ঠিকানা নিতে পারবেন।</p>
    </div>
  `;

  return {
    id: randomId(),
    to: toAddress,
    from: 'noreply@rana.fr',
    fromName: 'rana.fr Mail Desk',
    subject: `স্বাগতম — আপনার ইনবক্স সক্রিয় (কোড: ${otp})`,
    text,
    html,
    headers: {
      'Message-ID': `<${randomId()}@rana.fr>`,
      From: 'rana.fr Mail Desk <noreply@rana.fr>',
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

function buildStaticPresetMessage(
  toAddress: string,
  preset: TestTemplateType,
  custom?: { fromName?: string; from?: string; subject?: string; text?: string }
): MailMessage {
  const now = Date.now();
  const otp5 = String(10000 + Math.floor(Math.random() * 89999));
  const otp = randomDigits(6);

  if (preset === 'otp5') {
    return {
      id: randomId(),
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
        'Message-ID': `<${randomId()}@socialmail.example>`,
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
      id: randomId(),
      to: toAddress,
      from,
      fromName,
      subject,
      text,
      html: `<div style="font-family: system-ui, sans-serif; line-height: 1.6;">${escapedHtml}</div>`,
      headers: {
        'Message-ID': `<${randomId()}@rana.fr>`,
        From: `${fromName} <${from}>`,
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [],
      receivedAt: now,
      read: false,
      detectedOtp: extractOtpCode(subject, text),
    };
  }

  if (preset === 'welcome') {
    const token = randomId().replace(/-/g, '').slice(0, 16);
    return {
      id: randomId(),
      to: toAddress,
      from: 'accounts@cloudstack.example',
      fromName: 'CloudStack Accounts',
      subject: 'Confirm your CloudStack account email',
      text: `Hi there,\n\nPlease confirm ${toAddress} by clicking the verification link below:\nhttps://cloudstack.example/verify?token=${token}\n\nOr enter verification code: ${otp}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 540px;">
          <h2 style="margin: 0 0 12px;">Confirm your email address</h2>
          <p>Click the button below to verify <strong>${toAddress}</strong> for your new workspace.</p>
          <p style="margin: 20px 0;">
            <a href="https://cloudstack.example/verify?token=${token}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
          </p>
          <p style="color: #64748b; font-size: 13px;">Backup verification code: <strong style="font-family: monospace; color: #0f172a;">${otp}</strong></p>
        </div>
      `,
      headers: {
        'Message-ID': `<${randomId()}@cloudstack.example>`,
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
    const invoiceNo = `INV-${randomDigits(5)}`;
    return {
      id: randomId(),
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
        'Message-ID': `<${randomId()}@nordicpay.example>`,
        From: 'NordicPay Billing <billing@nordicpay.example>',
        To: toAddress,
        Date: new Date(now).toUTCString(),
        'Content-Type': 'text/html; charset=UTF-8',
      },
      attachments: [
        {
          filename: `${invoiceNo}.txt`,
          contentType: 'text/plain',
          size: 132,
          contentBase64: btoa(
            `Invoice: ${invoiceNo}\nRecipient: ${toAddress}\nAmount: EUR 29.00\nStatus: PAID\nDate: ${new Date(now).toISOString()}\n`
          ),
        },
      ],
      receivedAt: now,
      read: false,
      detectedOtp: null,
    };
  }

  return {
    id: randomId(),
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
      'Message-ID': `<${randomId()}@authguard.example>`,
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

export async function createInbox(options?: {
  localPart?: string;
  seedWelcome?: boolean;
}): Promise<{ inbox: Inbox; messages: MailMessage[] } | null> {
  if (await isBackendAvailable()) {
    const res = await fetch('/api/inboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {}),
    });
    if (!res.ok) return null;
    return res.json();
  }

  const store = readStaticStore();
  let localPart = '';
  if (options?.localPart) {
    localPart = options.localPart.trim().toLowerCase().replace(/@rana\.fr$/i, '');
    if (!isValidLocalPart(localPart)) return null;
  } else {
    do {
      localPart = generateRandomLocalPart();
    } while (store.inboxes[`${localPart}@${DOMAIN}`]);
  }

  const address = `${localPart}@${DOMAIN}`;
  const now = Date.now();
  const existing = store.inboxes[address];
  const inbox: Inbox = existing
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
    if (options?.seedWelcome) {
      store.messages[address].push(buildStaticWelcomeMessage(address));
    }
  }
  writeStaticStore(store);
  return { inbox, messages: store.messages[address] };
}

export async function fetchInbox(
  address: string
): Promise<{ inbox: Inbox; messages: MailMessage[] }> {
  if (await isBackendAvailable()) {
    const res = await fetch(`/api/inboxes/${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error('Failed to load inbox');
    return res.json();
  }

  const normalized = normalizeAddress(address);
  const [localPart] = normalized.split('@');
  const store = readStaticStore();
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
    writeStaticStore(store);
  }
  return {
    inbox: store.inboxes[normalized],
    messages: store.messages[normalized] ?? [],
  };
}

export async function extendInbox(address: string): Promise<Inbox | null> {
  if (await isBackendAvailable()) {
    const res = await fetch(`/api/inboxes/${encodeURIComponent(address)}/extend`, {
      method: 'POST',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { inbox: Inbox };
    return data.inbox;
  }

  const normalized = normalizeAddress(address);
  const store = readStaticStore();
  if (store.inboxes[normalized]) {
    store.inboxes[normalized].expiresAt = Date.now() + INBOX_TTL_MS;
    writeStaticStore(store);
    return store.inboxes[normalized];
  }
  return null;
}

export async function burnInbox(address: string): Promise<void> {
  if (await isBackendAvailable()) {
    await fetch(`/api/inboxes/${encodeURIComponent(address)}`, { method: 'DELETE' }).catch(
      () => {}
    );
    return;
  }

  const normalized = normalizeAddress(address);
  const store = readStaticStore();
  delete store.inboxes[normalized];
  delete store.messages[normalized];
  writeStaticStore(store);
}

export async function markMessageRead(id: string): Promise<void> {
  if (await isBackendAvailable()) {
    await fetch(`/api/messages/${encodeURIComponent(id)}/read`, { method: 'PATCH' }).catch(
      () => {}
    );
    return;
  }

  const store = readStaticStore();
  for (const msgs of Object.values(store.messages)) {
    const target = msgs.find((m) => m.id === id);
    if (target) {
      target.read = true;
      writeStaticStore(store);
      break;
    }
  }
}

export async function deleteMessage(id: string): Promise<void> {
  if (await isBackendAvailable()) {
    await fetch(`/api/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(
      () => {}
    );
    return;
  }

  const store = readStaticStore();
  for (const [address, msgs] of Object.entries(store.messages)) {
    const idx = msgs.findIndex((m) => m.id === id);
    if (idx !== -1) {
      msgs.splice(idx, 1);
      writeStaticStore(store);
      postStaticEvent(address, 'message_deleted', { id });
      break;
    }
  }
}

export async function sendSimulatedMessage(
  address: string,
  payload: {
    preset: TestTemplateType;
    fromName?: string;
    from?: string;
    subject?: string;
    text?: string;
  }
): Promise<MailMessage | null> {
  if (await isBackendAvailable()) {
    const res = await fetch(`/api/inboxes/${encodeURIComponent(address)}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message: MailMessage };
    return data.message;
  }

  const normalized = normalizeAddress(address);
  const store = readStaticStore();
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
  }
  const msg = buildStaticPresetMessage(normalized, payload.preset, payload);
  store.messages[normalized] = [msg, ...(store.messages[normalized] ?? [])].slice(0, 100);
  writeStaticStore(store);
  postStaticEvent(normalized, 'new_message', msg);
  return msg;
}

export async function deliverInboundMessage(payload: {
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (await isBackendAvailable()) {
    try {
      const res = await fetch('/api/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true };
      const err = await res.json();
      return { ok: false, error: err.error || 'Delivery failed' };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }

  const match = payload.to.match(/([a-zA-Z0-9._-]+@rana\.fr)/i);
  const normalizedTo = (match?.[1] ?? payload.to).trim().toLowerCase();
  const [local, dom] = normalizedTo.split('@');
  if (dom !== DOMAIN || !isValidLocalPart(local)) {
    return { ok: false, error: `Recipient must be a valid @${DOMAIN} address` };
  }

  const msg = await sendSimulatedMessage(normalizedTo, {
    preset: 'custom',
    from: payload.from,
    fromName: payload.fromName || payload.from.split('@')[0],
    subject: payload.subject,
    text: payload.text,
  });
  return msg ? { ok: true } : { ok: false, error: 'Failed to store message' };
}

export function downloadMessageEml(msg: MailMessage): void {
  const headerLines = Object.entries(msg.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\r\n');
  const emlContent = `${headerLines}\r\nSubject: ${msg.subject}\r\n\r\n${msg.html || msg.text}`;
  const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rana-fr-${msg.id.slice(0, 8)}.eml`;
  a.click();
  URL.revokeObjectURL(url);
}

export function subscribeInboxEvents(
  address: string,
  handlers: {
    onConnected: () => void;
    onNewMessage: (msg: MailMessage) => void;
    onMessageDeleted: (id: string) => void;
    onDisconnected: () => void;
  }
): () => void {
  let cancelled = false;
  let cleanupFn: (() => void) | null = null;

  isBackendAvailable().then((hasBackend) => {
    if (cancelled) return;

    if (hasBackend) {
      const es = new EventSource(`/api/events/${encodeURIComponent(address)}`);
      es.addEventListener('connected', () => handlers.onConnected());
      es.addEventListener('new_message', (event) => {
        try {
          const msg = JSON.parse((event as MessageEvent).data) as MailMessage;
          handlers.onNewMessage(msg);
        } catch {
          // Ignore
        }
      });
      es.addEventListener('message_deleted', (event) => {
        try {
          const { id } = JSON.parse((event as MessageEvent).data) as { id: string };
          handlers.onMessageDeleted(id);
        } catch {
          // Ignore
        }
      });
      es.onerror = () => handlers.onDisconnected();
      cleanupFn = () => {
        handlers.onDisconnected();
        es.close();
      };
      return;
    }

    // Static GitHub Pages mode: instant local BroadcastChannel live sync
    handlers.onConnected();
    const channel =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

    if (channel) {
      channel.onmessage = (event) => {
        const data = event.data as { address: string; type: string; payload: unknown };
        if (data?.address !== address) return;
        if (data.type === 'new_message') {
          handlers.onNewMessage(data.payload as MailMessage);
        } else if (data.type === 'message_deleted') {
          handlers.onMessageDeleted((data.payload as { id: string }).id);
        }
      };
    }

    cleanupFn = () => {
      channel?.close();
    };
  });

  return () => {
    cancelled = true;
    cleanupFn?.();
  };
}
