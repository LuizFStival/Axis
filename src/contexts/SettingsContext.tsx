import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

type SettingsContextValue = {
  investmentGoalPercent: number;
  setInvestmentGoalPercent: (percent: number) => void;
};

type AxisSettings = {
  investmentGoalPercent: number;
};

const DEFAULT_SETTINGS: AxisSettings = {
  investmentGoalPercent: 20,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const storageKey = useMemo(() => `axis_settings_${userId ?? 'guest'}`, [userId]);
  const [settings, setSettings] = useState<AxisSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AxisSettings;
        setSettings({
          investmentGoalPercent: Number.isFinite(parsed.investmentGoalPercent)
            ? parsed.investmentGoalPercent
            : DEFAULT_SETTINGS.investmentGoalPercent,
        });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [storageKey]);

  const setInvestmentGoalPercent = (percent: number) => {
    const safePercent = Math.min(Math.max(Number(percent) || 0, 0), 100);
    const next = { ...settings, investmentGoalPercent: safePercent };
    setSettings(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <SettingsContext.Provider value={{ investmentGoalPercent: settings.investmentGoalPercent, setInvestmentGoalPercent }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
