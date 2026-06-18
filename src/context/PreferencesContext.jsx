import React, { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext(null);

const API_BASE = '/api/preferences';

export const PreferencesProvider = ({ children }) => {
  const [device, setDeviceState] = useState('mobile');
  const [theme, setThemeState] = useState('dark');
  const [loading, setLoading] = useState(true);

  // --- Load preferences from backend on mount ---
  useEffect(() => {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeviceState(data.data.device || 'mobile');
          setThemeState(data.data.theme || 'dark');
        }
      })
      .catch(err => console.error('Error loading preferences:', err))
      .finally(() => setLoading(false));
  }, []);

  // --- Apply theme class to <body> whenever theme changes ---
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // --- Persist single preference key to backend ---
  const persistPreference = (key, value) => {
    fetch(API_BASE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) console.error('Failed to persist preference:', data.message);
      })
      .catch(err => console.error('Error persisting preference:', err));
  };

  // --- Public setters (update state + backend) ---
  const setDevice = (newDevice) => {
    setDeviceState(newDevice);
    persistPreference('device', newDevice);
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    persistPreference('theme', newTheme);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Pixel widths for each device mode
  const deviceWidths = {
    mobile: '480px',
    tablet: '800px',
    desktop: '1200px',
  };

  return (
    <PreferencesContext.Provider
      value={{ device, theme, loading, setDevice, setTheme, toggleTheme, deviceWidths }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
