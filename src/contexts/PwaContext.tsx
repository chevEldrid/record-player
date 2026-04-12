import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function detectStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const mediaQueryStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && window.navigator.standalone === true;

  return Boolean(mediaQueryStandalone || iosStandalone);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(detectStandaloneMode);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function syncInstalledState() {
      setIsInstalled(detectStandaloneMode());
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstallEvent(null);
      setIsInstalled(true);
    }

    syncInstalledState();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', syncInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', syncInstalledState);
    };
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: !isInstalled && Boolean(installEvent),
      isInstalled,
      async install() {
        if (!installEvent) {
          return false;
        }

        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        const accepted = choice.outcome === 'accepted';

        if (accepted) {
          setInstallEvent(null);
          setIsInstalled(true);
        }

        return accepted;
      },
    }),
    [installEvent, isInstalled]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) {
    throw new Error('usePwa must be used within PwaProvider.');
  }

  return value;
}
