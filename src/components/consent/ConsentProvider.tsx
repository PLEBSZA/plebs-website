"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentContextValue = {
  preferences: ConsentPreferences;
  resolved: boolean;
  needsPrompt: boolean;
  openPreferences: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (next: Omit<ConsentPreferences, "necessary">) => void;
  preferencesOpen: boolean;
  closePreferences: () => void;
};

const STORAGE_KEY = "plebs-consent-v1";
const CONSENT_EVENT = "plebs:consent";

const defaultUnresolved: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function parseStoredConsent(raw: string | null): ConsentPreferences | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

function persistConsent(preferences: ConsentPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: preferences }));
}

function subscribeConsent(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(CONSENT_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getConsentSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerConsentSnapshot(): string | null {
  return null;
}

function subscribeHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const storedRaw = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const stored = useMemo(() => parseStoredConsent(storedRaw), [storedRaw]);
  const hasHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const preferences = stored ?? defaultUnresolved;
  const resolved = hasHydrated;
  const needsPrompt = hasHydrated && stored === null;

  const acceptAll = useCallback(() => {
    persistConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    setPreferencesOpen(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    persistConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setPreferencesOpen(false);
  }, []);

  const savePreferences = useCallback(
    (next: Omit<ConsentPreferences, "necessary">) => {
      persistConsent({
        necessary: true,
        analytics: next.analytics,
        marketing: next.marketing,
      });
      setPreferencesOpen(false);
    },
    [],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      preferences,
      resolved,
      needsPrompt,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      acceptAll,
      rejectNonEssential,
      savePreferences,
      preferencesOpen,
    }),
    [
      preferences,
      resolved,
      needsPrompt,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      preferencesOpen,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return context;
}

export function useAnalyticsAllowed() {
  const { preferences, resolved, needsPrompt } = useConsent();
  return resolved && !needsPrompt && preferences.analytics;
}
