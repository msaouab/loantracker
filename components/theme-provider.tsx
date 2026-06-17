"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

type ThemeState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
};

const serverSnapshot: ThemeState = { theme: "system", resolvedTheme: "light" };

let snapshot: ThemeState = serverSnapshot;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): ThemeState {
  return snapshot;
}

function getServerSnapshot(): ThemeState {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && listeners.size === 0) {
    const theme = readStoredTheme();
    snapshot = { theme, resolvedTheme: resolveTheme(theme) };
    applyTheme(theme);
  }

  listeners.add(listener);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    if (snapshot.theme === "system") {
      const resolved = resolveTheme("system");
      snapshot = { ...snapshot, resolvedTheme: resolved };
      applyTheme("system");
      emit();
    }
  };

  media.addEventListener("change", handleSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", handleSystemChange);
  };
}

function setThemeState(next: Theme) {
  snapshot = { theme: next, resolvedTheme: resolveTheme(next) };
  applyTheme(next);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Ignore storage access errors.
  }

  emit();
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { theme, resolvedTheme } = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Locale switches refresh the root layout and can reset <html> classes applied
  // outside React (light/dark). Re-apply the stored preference after those updates.
  React.useLayoutEffect(() => {
    applyTheme(theme);
  }, [locale, theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    return {
      theme: "system" as Theme,
      setTheme: () => undefined,
      resolvedTheme: "light" as ResolvedTheme,
    };
  }

  return context;
}
