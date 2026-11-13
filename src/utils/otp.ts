import type { Language } from '../types/mail';

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractOtpCode(subject: string, text: string, html = ''): string | null {
  const cleanHtml = html ? stripHtmlTags(html) : '';
  const combined = `${subject}\n${text}\n${cleanHtml}`;

  // 1. Prefixed codes like FB-58392, G-58392, TG-58392
  const prefixed = combined.match(/\b(?:FB|G|TG|WA|OTP)[-\s]?(\d{5,8})\b/i);
  if (prefixed?.[1]) {
    return prefixed[1];
  }

  // 2. Keyword followed by 4-8 digit code
  const keywordBefore = combined.match(
    /(?:code|otp|pin|confirm|confirmation|verification|verify|passcode|token|security|login|auth|কোড|পিন|ভেরিফিকেশন|নিশ্চিতকরণ)[^\d]{0,40}\b(\d{4,8})\b/i
  );
  if (keywordBefore?.[1]) {
    return keywordBefore[1];
  }

  // 3. 4-8 digit code followed by keyword (e.g. "58392 is your Facebook confirmation code")
  const codeBeforeKeyword = combined.match(
    /\b(\d{4,8})\b[^\d\n]{1,40}(?:is your|your|হলো|আপনার|code|otp|pin|confirmation|verification|কোড)/i
  );
  if (codeBeforeKeyword?.[1]) {
    return codeBeforeKeyword[1];
  }

  // 4. Standalone 5-digit or 6-digit code on its own line or separated by whitespace
  const standalone = combined.match(/(?:^|\s)(\d{5,6})(?:\s|$)/m);
  if (standalone?.[1]) {
    return standalone[1];
  }

  return null;
}

export function extractActionLink(text: string, html: string): string | null {
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  const candidates = [...(html.match(urlRegex) ?? []), ...(text.match(urlRegex) ?? [])];
  const verifyLink = candidates.find((url) =>
    /verify|confirm|activate|auth|magic|token|login|reset/i.test(url)
  );
  return verifyLink ?? null;
}

export function formatClockTime(timestamp: number, lang: Language): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatFullTimestamp(timestamp: number, lang: Language): string {
  const date = new Date(timestamp);
  return date.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatCountdown(expiresAt: number, now: number): string {
  const remainingMs = Math.max(0, expiresAt - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildSandboxedEmailHtml(rawHtml: string, darkMode: boolean): string {
  const sanitized = rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, 'blocked:');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
  body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.65;
    color: ${darkMode ? '#e2e8f0' : '#0f172a'};
    background: ${darkMode ? '#0f172a' : '#ffffff'};
    word-break: break-word;
  }
  a { color: ${darkMode ? '#60a5fa' : '#2563eb'}; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  table { max-width: 100%; border-collapse: collapse; }
  pre, code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: ${darkMode ? '#1e293b' : '#f1f5f9'};
    padding: 2px 6px;
    border-radius: 4px;
  }
</style>
</head>
<body>${sanitized}</body>
</html>`;
}
