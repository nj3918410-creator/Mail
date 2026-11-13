import React, { useEffect, useState } from 'react';
import { Check, Copy, Send } from 'lucide-react';
import type { Translations } from '../utils/i18n';
import { deliverInboundMessage } from '../utils/mailClient';

interface InboundApiViewProps {
  activeAddress: string;
  t: Translations;
  onDelivered: () => void;
}

export const InboundApiView: React.FC<InboundApiViewProps> = ({
  activeAddress,
  t,
  onDelivered,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rana.fr';
  const endpointUrl = `${origin}/api/inbound`;

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [to, setTo] = useState(activeAddress);

  useEffect(() => {
    setTo(activeAddress);
  }, [activeAddress]);
  const [from, setFrom] = useState('alerts@service.example');
  const [subject, setSubject] = useState('API Webhook Test · Code 741852');
  const [bodyText, setBodyText] = useState(
    'This message was delivered via POST /api/inbound.\nYour verification code is 741852.'
  );
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(endpointUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatusMsg('');
    try {
      const result = await deliverInboundMessage({
        to,
        from,
        fromName: from.split('@')[0],
        subject,
        text: bodyText,
      });
      if (result.ok) {
        setStatusMsg(t.apiView.sentSuccess);
        onDelivered();
      } else {
        setStatusMsg(result.error || 'Delivery failed');
      }
    } catch {
      setStatusMsg('Network error');
    } finally {
      setSending(false);
    }
  };

  const curlSnippet = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${activeAddress}",
    "from": "noreply@example.com",
    "fromName": "Example App",
    "subject": "Verification Code 482910",
    "text": "Your one-time code is 482910."
  }'`;

  const workerSnippet = `export default {
  async email(message, env, ctx) {
    const rawMime = await new Response(message.raw).text();
    await fetch("${endpointUrl}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        subject: message.headers.get("subject") || "(No subject)",
        raw: rawMime
      })
    });
  }
};`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Webhook Test Console */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2
            className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
            style={{ textWrap: 'balance' }}
          >
            {t.apiView.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {t.apiView.subtitle}
          </p>

          <div className="mt-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              {t.apiView.endpointLabel}
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5">
              <code className="text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 truncate">
                POST {endpointUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{t.apiView.copyEndpoint}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleWebhookTest} className="mt-6 space-y-3.5">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.apiView.testerTitle}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.apiView.toLabel}
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.apiView.fromLabel}
                </label>
                <input
                  type="email"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.apiView.subjectLabel}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t.apiView.bodyLabel}
              </label>
              <textarea
                rows={3}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{sending ? t.apiView.sending : t.apiView.sendBtn}</span>
              </button>

              {statusMsg && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {statusMsg}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Code Snippets & Cloudflare Worker Setup */}
        <section className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
              {t.apiView.curlTitle}
            </h3>
            <pre className="text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto">
              {curlSnippet}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              {t.apiView.cloudflareTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 mb-3 leading-relaxed">
              {t.apiView.cloudflareDesc}
            </p>
            <pre className="text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto">
              {workerSnippet}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};
