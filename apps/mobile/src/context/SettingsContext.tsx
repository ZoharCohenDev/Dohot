import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type FontSizePref = 'sm' | 'md' | 'lg';

const FONT_SCALE: Record<FontSizePref, number> = {
  sm: 0.875,
  md: 1.0,
  lg: 1.125,
};

interface SettingsContextValue {
  fontSizePref: FontSizePref;
  fontScale: number;
  setFontSizePref: (pref: FontSizePref) => void;
  dark: boolean;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  fontSizePref: 'md',
  fontScale: 1.0,
  setFontSizePref: () => {},
  dark: false,
  toggleTheme: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSizePref, setFontSizePrefState] = useState<FontSizePref>('md');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('font_size_pref').then((stored) => {
      if (stored === 'sm' || stored === 'md' || stored === 'lg') {
        setFontSizePrefState(stored);
      }
    });
    SecureStore.getItemAsync('theme_pref').then((stored) => {
      if (stored === 'dark') setDark(true);
    });
  }, []);

  const setFontSizePref = (pref: FontSizePref) => {
    setFontSizePrefState(pref);
    SecureStore.setItemAsync('font_size_pref', pref).catch(() => {});
  };

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync('theme_pref', next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        fontSizePref,
        fontScale: FONT_SCALE[fontSizePref],
        setFontSizePref,
        dark,
        toggleTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
