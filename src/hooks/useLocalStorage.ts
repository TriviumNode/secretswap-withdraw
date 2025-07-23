import { useState, useEffect } from 'react';
import type { LocalStorageData } from '../types';

const STORAGE_KEY = 'secretswap-migration';

const defaultData: LocalStorageData = {
  theme: 'light',
  viewingKeys: {},
};

export const useLocalStorage = () => {
  const [data, setData] = useState<LocalStorageData>(defaultData);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData({ ...defaultData, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [data]);

  const updateTheme = (theme: 'light' | 'dark') => {
    setData(prev => ({ ...prev, theme }));
  };

  const saveViewingKeys = (walletAddress: string, poolAddresses: string[]) => {
    setData(prev => ({
      ...prev,
      viewingKeys: { ...prev.viewingKeys, [walletAddress]: poolAddresses }
    }));
  };

  const getViewingKeys = (walletAddress: string): string[] => {
    return data.viewingKeys[walletAddress] || [];
  };

  const getPermit = (walletAddress: string): string | null => {
    const cacheKey = `SecretSwap-Migration-Permit-${walletAddress}`;
    const cached = localStorage.getItem(cacheKey);
    return cached;
  }

  const clearData = () => {
    setData(defaultData);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    theme: data.theme,
    updateTheme,
    saveViewingKeys,
    getViewingKeys,
    getPermit,
    clearData,
  };
}; 