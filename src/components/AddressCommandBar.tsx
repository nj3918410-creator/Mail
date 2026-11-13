import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Edit3,
  Globe,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import type { Inbox, Language } from '../types/mail';
import type { Translations } from '../utils/i18n';
import { formatCountdown } from '../utils/otp';

interface AddressCommandBarProps {
  inbox: Inbox | null;
  savedAddresses: string[];
  unreadCount: number;
  totalCount: number;
  sseConnected: boolean;
  darkMode: boolean;
  lang: Language;
  t: Translations;
  onCopyAddress: () => void;
  copiedAddress: boolean;
  onRandomize: () => void;
  onSetCustomAlias: (localPart: string) => Promise<boolean>;
  onExtendInbox: () => void;
  onBurnInbox: () => void;
  onSwitchInbox: (address: string) => void;
  onToggleDark: () => void;
  onToggleLang: () => void;
}

export const AddressCommandBar: React.FC<AddressCommandBarProps> = ({
  inbox,
  savedAddresses,
  unreadCount,
  totalCount,
  sseConnected,
  darkMode,
  lang,
  t,
  onCopyAddress,
  copiedAddress,
  onRandomize,
  onSetCustomAlias,
  onExtendInbox,
  onBurnInbox,
  onSwitchInbox,
  onToggleDark,
  onToggleLang,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startEditing = () => {
    setAliasInput(inbox?.localPart ?? '');
    setAliasError('');
    setEditingAlias(true);
  };

  const handleAliasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = aliasInput.trim().toLowerCase().replace(/@rana\.fr$/i, '');
    if (!/^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(cleaned) || /\.\./.test(cleaned)) {
      setAliasError(t.addressBar.invalidAlias);
      return;
    }
    setSavingAlias(true);
    const ok = await onSetCustomAlias(cleaned);
    setSavingAlias(false);
    if (ok) {
      setEditingAlias(false);
      setAliasError('');
    } else {
      setAliasError(t.addressBar.invalidAlias);
    }
  };

  const countdown = inbox ? formatCountdown(inbox.expiresAt, now) : '60:00';

  return (
    <section
      aria-label="Disposable email controls"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6"
    >
      {/* Top row: Label + Workspace preferences */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {t.addressBar.label}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Switch language"
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.toolbar.lightMode}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.toolbar.darkMode}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Focal Address Row */}
      {editingAlias ? (
        <form onSubmit={handleAliasSubmit} className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center border border-blue-500 dark:border-blue-400 rounded-lg bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5">
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => {
                  setAliasInput(e.target.value);
                  setAliasError('');
                }}
                autoFocus
                aria-label="Custom username"
                className="flex-1 min-w-0 bg-transparent font-mono text-base sm:text-lg text-slate-900 dark:text-slate-100 focus:outline-none"
                placeholder="alex.dev"
              />
              <span className="font-mono text-base sm:text-lg font-medium text-slate-500 dark:text-slate-400 select-none pl-1">
                @rana.fr
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={savingAlias}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{t.addressBar.save}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingAlias(false);
                  setAliasError('');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{t.addressBar.cancel}</span>
              </button>
            </div>
          </div>
          {aliasError && (
            <p className="text-xs text-red-600 dark:text-red-400">{aliasError}</p>
          )}
        </form>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Email Address Display Box */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3">
            <div className="min-w-0 flex items-baseline font-mono text-lg sm:text-2xl font-semibold tracking-tight truncate">
              <span className="text-slate-900 dark:text-slate-100 truncate">
                {inbox?.localPart ?? '...'}
              </span>
              <span className="text-blue-600 dark:text-blue-400 shrink-0">@rana.fr</span>
            </div>

            <button
              type="button"
              onClick={onCopyAddress}
              disabled={!inbox}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                copiedAddress
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copiedAddress ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{t.addressBar.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>{t.addressBar.copy}</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" />
              <span>{t.addressBar.customEdit}</span>
            </button>

            <button
              type="button"
              onClick={onRandomize}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>{t.addressBar.random}</span>
            </button>

            <button
              type="button"
              onClick={onExtendInbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{t.addressBar.extend}</span>
            </button>

            <button
              type="button"
              onClick={onBurnInbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>{t.addressBar.burn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Zero-Pill Tabular Metadata Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Radio
              className={`w-3.5 h-3.5 ${
                sseConnected
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
              aria-hidden="true"
            />
            <span>{sseConnected ? t.addressBar.liveStream : t.addressBar.reconnecting}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {t.addressBar.expiresIn}:{' '}
            <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {countdown}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {t.addressBar.unread}:{' '}
            <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {unreadCount}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {t.addressBar.total}:{' '}
            <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {totalCount}
            </strong>
          </span>
        </div>

        {/* Active session alias switcher */}
        {savedAddresses.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mr-1">
              {t.addressBar.activeInboxes}:
            </span>
            {savedAddresses.slice(0, 4).map((addr) => {
              const active = addr === inbox?.address;
              return (
                <button
                  key={addr}
                  type="button"
                  onClick={() => onSwitchInbox(addr)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {addr.split('@')[0]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
