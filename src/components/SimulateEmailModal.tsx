import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import type { TestTemplateType } from '../types/mail';
import type { Translations } from '../utils/i18n';

interface SimulateEmailModalProps {
  open: boolean;
  address: string;
  t: Translations;
  onClose: () => void;
  onSendTest: (payload: {
    preset: TestTemplateType;
    fromName?: string;
    from?: string;
    subject?: string;
    text?: string;
  }) => Promise<void>;
}

export const SimulateEmailModal: React.FC<SimulateEmailModalProps> = ({
  open,
  address,
  t,
  onClose,
  onSendTest,
}) => {
  const [preset, setPreset] = useState<TestTemplateType>('otp5');
  const [fromName, setFromName] = useState('Nexus Verification');
  const [from, setFrom] = useState('verify@nexus-app.example');
  const [subject, setSubject] = useState('59381 is your confirmation code');
  const [text, setText] = useState(
    'আপনার @rana.fr অ্যাকাউন্ট যাচাই করতে নিচের ৫-ডিজিটের কোডটি ব্যবহার করুন: FB-59381\n\nভেরিফিকেশন লিংক: https://nexus-app.example/verify?token=demo921'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSendTest(
      preset === 'custom'
        ? { preset, fromName, from, subject, text }
        : { preset }
    );
    setSubmitting(false);
    onClose();
  };

  const presets: Array<{ id: TestTemplateType; label: string }> = [
    { id: 'otp5', label: t.modal.presetOtp5 },
    { id: 'otp', label: t.modal.presetOtp },
    { id: 'welcome', label: t.modal.presetWelcome },
    { id: 'invoice', label: t.modal.presetInvoice },
    { id: 'custom', label: t.modal.presetCustom },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2
              id="simulate-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              {t.modal.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t.modal.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modal.close}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
            To: <span className="text-slate-900 dark:text-slate-100 font-semibold">{address}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`flex-1 min-w-[110px] px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  preset === p.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.modal.senderName}
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.modal.senderEmail}
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.modal.subject}
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.modal.messageBody}
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t.modal.close}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{t.modal.sendNow}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
