import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Inbox as InboxIcon,
  KeyRound,
  MailOpen,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import type {
  Language,
  MailAttachment,
  MailMessage,
  MessageFilter,
  ReaderTab,
} from '../types/mail';
import type { Translations } from '../utils/i18n';
import {
  buildSandboxedEmailHtml,
  extractActionLink,
  extractOtpCode,
  formatBytes,
  formatClockTime,
  formatFullTimestamp,
} from '../utils/otp';
import { downloadMessageEml } from '../utils/mailClient';

interface MailboxViewProps {
  messages: MailMessage[];
  selectedId: string | null;
  loading: boolean;
  darkMode: boolean;
  lang: Language;
  t: Translations;
  onSelectMessage: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onRefresh: () => void;
  onOpenTestModal: () => void;
}

export const MailboxView: React.FC<MailboxViewProps> = ({
  messages,
  selectedId,
  loading,
  darkMode,
  lang,
  t,
  onSelectMessage,
  onDeleteMessage,
  onRefresh,
  onOpenTestModal,
}) => {
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');
  const [readerTab, setReaderTab] = useState<ReaderTab>('html');
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((msg) => {
      if (filter === 'unread' && msg.read) return false;
      const otp = msg.detectedOtp ?? extractOtpCode(msg.subject, msg.text, msg.html);
      if (filter === 'otp' && !otp) return false;
      if (!q) return true;
      return (
        msg.subject.toLowerCase().includes(q) ||
        msg.from.toLowerCase().includes(q) ||
        msg.fromName.toLowerCase().includes(q) ||
        msg.text.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, search]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId]
  );

  const selectedOtp = useMemo(() => {
    if (!selectedMessage) return null;
    return (
      selectedMessage.detectedOtp ??
      extractOtpCode(selectedMessage.subject, selectedMessage.text, selectedMessage.html)
    );
  }, [selectedMessage]);

  const selectedActionLink = useMemo(() => {
    if (!selectedMessage) return null;
    return extractActionLink(selectedMessage.text, selectedMessage.html);
  }, [selectedMessage]);

  const copyOtp = async (code: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedOtpId(id);
      setTimeout(() => setCopiedOtpId(null), 1800);
    } catch {
      // Fallback ignored
    }
  };

  const downloadAttachment = (att: MailAttachment) => {
    if (!att.contentBase64) return;
    const binary = atob(att.contentBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: att.contentType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterButtons: Array<{ id: MessageFilter; label: string }> = [
    { id: 'all', label: t.toolbar.all },
    { id: 'unread', label: t.toolbar.unread },
    { id: 'otp', label: t.toolbar.otpOnly },
  ];

  return (
    <section
      aria-label="Mailbox workspace"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Workspace Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented filter tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === btn.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.toolbar.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Toolbar Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.toolbar.sendTest}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{t.toolbar.refresh}</span>
          </button>
        </div>
      </div>

      {/* 2-Pane Mailbox Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Left Pane: Message List */}
        <div className="lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
          {loading && messages.length === 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
                <InboxIcon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.mailbox.emptyTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                {t.mailbox.emptyDesc}
              </p>
              <button
                type="button"
                onClick={onOpenTestModal}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{t.mailbox.emptyAction}</span>
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-500 dark:text-slate-400 text-center">
              {t.mailbox.noFilterMatch}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[600px]">
              {filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedId;
                const otp = msg.detectedOtp ?? extractOtpCode(msg.subject, msg.text, msg.html);
                return (
                  <div
                    key={msg.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMessage(msg.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectMessage(msg.id);
                      }
                    }}
                    className={`w-full text-left p-4 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-sm truncate ${
                          msg.read
                            ? 'font-medium text-slate-700 dark:text-slate-300'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {!msg.read && (
                          <span
                            aria-label="Unread"
                            className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mr-2 align-middle"
                          />
                        )}
                        {msg.fromName || msg.from}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        {formatClockTime(msg.receivedAt, lang)}
                      </span>
                    </div>

                    <p
                      className={`text-sm truncate ${
                        msg.read
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'font-semibold text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {msg.subject || t.mailbox.noSubject}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {msg.text}
                      </p>
                      {otp && (
                        <button
                          type="button"
                          onClick={(e) => copyOtp(otp, msg.id, e)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 rounded transition-colors shrink-0 cursor-pointer"
                          title={t.mailbox.copyCode}
                        >
                          {copiedOtpId === msg.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{otp}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Message Reader */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-white dark:bg-slate-900">
          {!selectedMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <MailOpen
                className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                {t.mailbox.selectPrompt}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Message Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h2
                    className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    {selectedMessage.subject || t.mailbox.noSubject}
                  </h2>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => downloadMessageEml(selectedMessage)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.mailbox.downloadEml}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteMessage(selectedMessage.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.mailbox.deleteMail}</span>
                    </button>
                  </div>
                </div>

                {/* Clean Key-Value Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="truncate">
                    <span className="text-slate-500 dark:text-slate-500 mr-2">
                      {t.mailbox.from}:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedMessage.fromName}
                    </span>{' '}
                    <span className="font-mono text-xs">&lt;{selectedMessage.from}&gt;</span>
                  </div>
                  <div className="truncate sm:text-right font-mono text-xs tabular-nums">
                    {formatFullTimestamp(selectedMessage.receivedAt, lang)}
                  </div>
                  <div className="truncate sm:col-span-2">
                    <span className="text-slate-500 dark:text-slate-500 mr-2">
                      {t.mailbox.to}:
                    </span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {selectedMessage.to}
                    </span>
                  </div>
                </div>

                {/* Smart OTP / Verification Action Strip */}
                {(selectedOtp || selectedActionLink) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3">
                    {selectedOtp ? (
                      <div className="flex items-center gap-3">
                        <KeyRound
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t.mailbox.otpDetected}
                          </div>
                          <div className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100 tabular-nums">
                            {selectedOtp}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t.mailbox.openLink}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {selectedOtp && (
                        <button
                          type="button"
                          onClick={() => copyOtp(selectedOtp, `reader-${selectedMessage.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedOtpId === `reader-${selectedMessage.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{t.mailbox.codeCopied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{t.mailbox.copyCode}</span>
                            </>
                          )}
                        </button>
                      )}
                      {selectedActionLink && (
                        <a
                          href={selectedActionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.mailbox.openLink}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments Strip */}
                {selectedMessage.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                      {t.mailbox.attachments}:
                    </span>
                    {selectedMessage.attachments.map((att, idx) => (
                      <button
                        key={`${att.filename}-${idx}`}
                        type="button"
                        onClick={() => downloadAttachment(att)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-mono">{att.filename}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          ({formatBytes(att.size)})
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Reader View Switch */}
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'html', label: t.mailbox.tabHtml },
                      { id: 'text', label: t.mailbox.tabText },
                      { id: 'raw', label: t.mailbox.tabRaw },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReaderTab(tab.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        readerTab === tab.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body Viewport */}
              <div className="flex-1 p-5 sm:p-6">
                {readerTab === 'html' && (
                  <iframe
                    title="Email preview"
                    sandbox=""
                    srcDoc={buildSandboxedEmailHtml(selectedMessage.html, darkMode)}
                    className="w-full min-h-[360px] h-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                  />
                )}

                {readerTab === 'text' && (
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-5 overflow-x-auto">
                    {selectedMessage.text}
                  </pre>
                )}

                {readerTab === 'raw' && (
                  <div className="space-y-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {Object.entries(selectedMessage.headers).map(([key, val]) => (
                            <tr key={key} className="bg-white dark:bg-slate-900">
                              <th className="py-2 px-3 font-mono font-semibold text-slate-600 dark:text-slate-400 w-40 align-top">
                                {key}
                              </th>
                              <td className="py-2 px-3 font-mono text-slate-900 dark:text-slate-100 break-all">
                                {val}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto">
                      {selectedMessage.html}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
