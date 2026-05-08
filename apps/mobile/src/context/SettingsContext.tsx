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
}

const SettingsContext = createContext<SettingsContextValue>({
  fontSizePref: 'md',
  fontScale: 1.0,
  setFontSizePref: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSizePref, setFontSizePrefState] = useState<FontSizePref>('md');

  useEffect(() => {
    SecureStore.getItemAsync('font_size_pref').then((stored) => {
      if (stored === 'sm' || stored === 'md' || stored === 'lg') {
        setFontSizePrefState(stored);
      }
    });
  }, []);

  const setFontSizePref = (pref: FontSizePref) => {
    setFontSizePrefState(pref);
    SecureStore.setItemAsync('font_size_pref', pref).catch(() => {});
  };

  return (
    <SettingsContext.Provider
      value={{
        fontSizePref,
        fontScale: FONT_SCALE[fontSizePref],
        setFontSizePref,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
