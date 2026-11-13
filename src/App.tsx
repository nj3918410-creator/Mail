import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TopBar } from './components/TopBar';
import { AddressCommandBar } from './components/AddressCommandBar';
import { MailboxView } from './components/MailboxView';
import { CustomAliasView } from './components/CustomAliasView';
import { InboundApiView } from './components/InboundApiView';
import { GuideView } from './components/GuideView';
import { SimulateEmailModal } from './components/SimulateEmailModal';
import { translations } from './utils/i18n';
import {
  burnInbox,
  createInbox,
  deleteMessage,
  extendInbox,
  fetchInbox,
  markMessageRead,
  sendSimulatedMessage,
  subscribeInboxEvents,
} from './utils/mailClient';
import type {
  Inbox,
  Language,
  MailMessage,
  NavSection,
  TestTemplateType,
} from './types/mail';

const STORAGE_ADDRESSES_KEY = 'rana_fr_saved_addresses';
const STORAGE_ACTIVE_KEY = 'rana_fr_active_address';
const STORAGE_LANG_KEY = 'rana_fr_lang';
const STORAGE_THEME_KEY = 'rana_fr_theme';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    return saved === 'en' ? 'en' : 'bn';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_THEME_KEY) === 'dark';
  });

  const [activeSection, setActiveSection] = useState<NavSection>('inbox');
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);

  const [savedAddresses, setSavedAddresses] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ADDRESSES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const t = translations[lang];

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ADDRESSES_KEY, JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  const registerSavedAddress = useCallback((address: string) => {
    localStorage.setItem(STORAGE_ACTIVE_KEY, address);
    setSavedAddresses((prev) => [address, ...prev.filter((a) => a !== address)].slice(0, 8));
  }, []);

  const loadInbox = useCallback(
    async (address: string) => {
      setLoading(true);
      try {
        const data = await fetchInbox(address);
        setInbox(data.inbox);
        setMessages(data.messages);
        registerSavedAddress(data.inbox.address);
        setSelectedId((prev) =>
          data.messages.some((m) => m.id === prev) ? prev : data.messages[0]?.id ?? null
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [registerSavedAddress]
  );

  const createRandomInbox = useCallback(
    async (seedWelcome = false) => {
      setLoading(true);
      try {
        const data = await createInbox({ seedWelcome });
        if (!data) throw new Error('Failed to create inbox');
        setInbox(data.inbox);
        setMessages(data.messages);
        registerSavedAddress(data.inbox.address);
        setSelectedId(data.messages[0]?.id ?? null);
        setActiveSection('inbox');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [registerSavedAddress]
  );

  const createCustomInbox = useCallback(
    async (localPart: string): Promise<boolean> => {
      try {
        const data = await createInbox({ localPart, seedWelcome: false });
        if (!data) return false;
        setInbox(data.inbox);
        setMessages(data.messages);
        registerSavedAddress(data.inbox.address);
        setSelectedId(data.messages[0]?.id ?? null);
        return true;
      } catch {
        return false;
      }
    },
    [registerSavedAddress]
  );

  useEffect(() => {
    const storedActive = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (storedActive && storedActive.endsWith('@rana.fr')) {
      loadInbox(storedActive);
    } else {
      createRandomInbox(true);
    }
  }, [loadInbox, createRandomInbox]);

  useEffect(() => {
    if (!inbox?.address) return;

    return subscribeInboxEvents(inbox.address, {
      onConnected: () => setSseConnected(true),
      onNewMessage: (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
        setSelectedId((prev) => prev ?? msg.id);
      },
      onMessageDeleted: (id) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      },
      onDisconnected: () => setSseConnected(false),
    });
  }, [inbox?.address]);

  const handleCopyAddress = async () => {
    if (!inbox) return;
    try {
      await navigator.clipboard.writeText(inbox.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleExtendInbox = async () => {
    if (!inbox) return;
    const updated = await extendInbox(inbox.address);
    if (updated) {
      setInbox(updated);
    }
  };

  const handleBurnInbox = async () => {
    if (!inbox) return;
    const burnedAddress = inbox.address;
    await burnInbox(burnedAddress);
    const remaining = savedAddresses.filter((a) => a !== burnedAddress);
    setSavedAddresses(remaining);
    if (remaining.length > 0) {
      loadInbox(remaining[0]);
    } else {
      createRandomInbox(false);
    }
  };

  const handleSelectMessage = async (id: string) => {
    setSelectedId(id);
    const target = messages.find((m) => m.id === id);
    if (target && !target.read) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
      markMessageRead(id).catch(() => {});
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
    deleteMessage(id).catch(() => {});
  };

  const handleSendTest = async (payload: {
    preset: TestTemplateType;
    fromName?: string;
    from?: string;
    subject?: string;
    text?: string;
  }) => {
    if (!inbox) return;
    const msg = await sendSimulatedMessage(inbox.address, payload);
    if (msg) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
      setSelectedId(msg.id);
    }
  };

  const handleRemoveSaved = async (address: string) => {
    setSavedAddresses((prev) => prev.filter((a) => a !== address));
    burnInbox(address).catch(() => {});
  };

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onCreateNewRandom={() => createRandomInbox(false)}
        t={t}
      />

      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <AddressCommandBar
          inbox={inbox}
          savedAddresses={savedAddresses}
          unreadCount={unreadCount}
          totalCount={messages.length}
          sseConnected={sseConnected}
          darkMode={darkMode}
          lang={lang}
          t={t}
          onCopyAddress={handleCopyAddress}
          copiedAddress={copiedAddress}
          onRandomize={() => createRandomInbox(false)}
          onSetCustomAlias={createCustomInbox}
          onExtendInbox={handleExtendInbox}
          onBurnInbox={handleBurnInbox}
          onSwitchInbox={(addr) => {
            loadInbox(addr);
            setActiveSection('inbox');
          }}
          onToggleDark={() => setDarkMode((d) => !d)}
          onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
        />

        {activeSection === 'inbox' && (
          <MailboxView
            messages={messages}
            selectedId={selectedId}
            loading={loading}
            darkMode={darkMode}
            lang={lang}
            t={t}
            onSelectMessage={handleSelectMessage}
            onDeleteMessage={handleDeleteMessage}
            onRefresh={() => inbox && loadInbox(inbox.address)}
            onOpenTestModal={() => setTestModalOpen(true)}
          />
        )}

        {activeSection === 'custom' && (
          <CustomAliasView
            activeAddress={inbox?.address ?? ''}
            savedAddresses={savedAddresses}
            t={t}
            onCreateCustom={async (localPart) => {
              const ok = await createCustomInbox(localPart);
              if (ok) setActiveSection('inbox');
              return ok;
            }}
            onSwitchInbox={(addr) => {
              loadInbox(addr);
              setActiveSection('inbox');
            }}
            onRemoveSaved={handleRemoveSaved}
          />
        )}

        {activeSection === 'api' && (
          <InboundApiView
            activeAddress={inbox?.address ?? 'demo@rana.fr'}
            t={t}
            onDelivered={() => inbox && loadInbox(inbox.address)}
          />
        )}

        {activeSection === 'guide' && <GuideView t={t} />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{t.footer.domain}</span>
          <span>{t.footer.note}</span>
        </div>
      </footer>

      <SimulateEmailModal
        open={testModalOpen}
        address={inbox?.address ?? ''}
        t={t}
        onClose={() => setTestModalOpen(false)}
        onSendTest={handleSendTest}
      />
    </div>
  );
}
