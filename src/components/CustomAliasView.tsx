import React, { useState } from 'react';
import { ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import type { Translations } from '../utils/i18n';

interface CustomAliasViewProps {
  activeAddress: string;
  savedAddresses: string[];
  t: Translations;
  onCreateCustom: (localPart: string) => Promise<boolean>;
  onSwitchInbox: (address: string) => void;
  onRemoveSaved: (address: string) => void;
}

const SUGGESTIONS = ['shop.rana', 'dev.test', 'signup.bd', 'news.temp', 'trial.2026', 'qa.verify'];

export const CustomAliasView: React.FC<CustomAliasViewProps> = ({
  activeAddress,
  savedAddresses,
  t,
  onCreateCustom,
  onSwitchInbox,
  onRemoveSaved,
}) => {
  const [localInput, setLocalInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = localInput.trim().toLowerCase().replace(/@rana\.fr$/i, '');
    if (!/^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(cleaned) || /\.\./.test(cleaned)) {
      setError(t.addressBar.invalidAlias);
      return;
    }
    setSubmitting(true);
    const ok = await onCreateCustom(cleaned);
    setSubmitting(false);
    if (ok) {
      setLocalInput('');
      setError('');
    } else {
      setError(t.addressBar.invalidAlias);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Create Custom Alias */}
      <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2
          className="font-display text-xl font-bold text-slate-900 dark:text-slate-100"
          style={{ textWrap: 'balance' }}
        >
          {t.customView.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          {t.customView.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="custom-alias-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.customView.inputLabel}
            </label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 focus-within:border-blue-600">
              <input
                id="custom-alias-input"
                type="text"
                value={localInput}
                onChange={(e) => {
                  setLocalInput(e.target.value);
                  setError('');
                }}
                placeholder={t.customView.inputPlaceholder}
                className="flex-1 min-w-0 bg-transparent font-mono text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="font-mono text-base font-medium text-blue-600 dark:text-blue-400 select-none pl-2">
                @rana.fr
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.customView.rulesNote}
            </p>
            {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || localInput.trim().length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t.customView.createBtn}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
            {t.customView.suggestions}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setLocalInput(`${s}${Math.floor(10 + Math.random() * 89)}`);
                  setError('');
                }}
                className="px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {s}@rana.fr
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Right: Saved Session Inboxes */}
      <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          {t.customView.savedTitle}
        </h3>

        {savedAddresses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.customView.savedEmpty}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {savedAddresses.map((addr) => {
              const isActive = addr === activeAddress;
              return (
                <div
                  key={addr}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {addr}
                    </div>
                    {isActive && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>{t.customView.activeLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSwitchInbox(addr)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>{t.customView.switchBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}

                    {savedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveSaved(addr)}
                        aria-label={t.customView.deleteBtn}
                        className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
