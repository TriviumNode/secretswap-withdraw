import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, RewardPool } from '../types';
import rewardPoolsData from '../data/reward_pools.json';

// Storage keys
const THEME_STORAGE_KEY = 'secretswap-migration-theme';
const VIEWING_KEYS_STORAGE_KEY = 'secretswap-migration-viewing-keys';

// Initial state
const initialState: AppState = {
  // Wallet
  isWalletConnected: false,
  walletAddress: null,
  scrtBalance: '0',
  
  // Theme
  theme: 'light',
  
  // Migration state
  currentStep: 'info',
  permitSignature: null,
  
  // Pool data
  rewardPools: rewardPoolsData as RewardPool[],
  selectedPoolAddresses: new Set(),
  poolBalances: {},
  viewingKeyStatuses: {},
  viewingKeysLoaded: false,
  
  // UI state
  isLoading: false,
  error: null,
  showModal: false,
  modalContent: null,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_WALLET_CONNECTION':
      return {
        ...state,
        isWalletConnected: true,
        walletAddress: action.payload.address,
        scrtBalance: action.payload.balance,
        error: null,
      };
      
    case 'DISCONNECT_WALLET':
      return {
        ...state,
        isWalletConnected: false,
        walletAddress: null,
        scrtBalance: '0',
        permitSignature: null,
        selectedPoolAddresses: new Set(),
        poolBalances: {},
        viewingKeyStatuses: {},
        viewingKeysLoaded: false,
        currentStep: 'info',
      };
      
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
      
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
      
    case 'SET_PERMIT_SIGNATURE':
      return {
        ...state,
        permitSignature: action.payload,
      };
      
    case 'SET_POOL_BALANCES':
      return {
        ...state,
        poolBalances: action.payload,
      };
      
    case 'SET_VIEWING_KEY_STATUSES':
      return {
        ...state,
        viewingKeyStatuses: action.payload,
      };
      
    case 'SET_VIEWING_KEYS_LOADED':
      return {
        ...state,
        viewingKeysLoaded: action.payload,
      };
      
    case 'SAVE_VIEWING_KEYS': {
      // Save to localStorage
      try {
        const stored = localStorage.getItem(VIEWING_KEYS_STORAGE_KEY);
        const viewingKeysData = stored ? JSON.parse(stored) : {};
        viewingKeysData[action.payload.walletAddress] = action.payload.poolAddresses;
        localStorage.setItem(VIEWING_KEYS_STORAGE_KEY, JSON.stringify(viewingKeysData));
      } catch (error) {
        console.error('Failed to save viewing keys to localStorage:', error);
      }
      return state;
    }
      
    case 'CLEAR_STORAGE_DATA':
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
        localStorage.removeItem(VIEWING_KEYS_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
      return {
        ...initialState,
        theme: 'light',
        rewardPools: state.rewardPools, // Keep pools data
      };
      
    case 'TOGGLE_POOL_SELECTION': {
      const newSelection = new Set(state.selectedPoolAddresses);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return {
        ...state,
        selectedPoolAddresses: newSelection,
      };
    }
      
    case 'SELECT_ALL_POOLS':
      return {
        ...state,
        selectedPoolAddresses: new Set(action.payload),
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
      
    case 'SHOW_MODAL':
      return {
        ...state,
        showModal: true,
        modalContent: action.payload,
      };
      
    case 'HIDE_MODAL':
      return {
        ...state,
        showModal: false,
        modalContent: null,
      };
      
    default:
      return state;
  }
};

// localStorage functions
const loadTheme = (): 'light' | 'dark' => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error);
    return 'light';
  }
};

const saveTheme = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
};

const getViewingKeys = (walletAddress: string): string[] => {
  try {
    const stored = localStorage.getItem(VIEWING_KEYS_STORAGE_KEY);
    if (!stored) return [];
    const viewingKeysData = JSON.parse(stored);
    return viewingKeysData[walletAddress] || [];
  } catch (error) {
    console.error('Failed to load viewing keys from localStorage:', error);
    return [];
  }
};

// Context creation
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getViewingKeys: (walletAddress: string) => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load theme immediately on app init
  useEffect(() => {
    const savedTheme = loadTheme();
    dispatch({ type: 'SET_THEME', payload: savedTheme });
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Update document theme when state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Load viewing keys after wallet connection
  useEffect(() => {
    if (state.walletAddress && !state.viewingKeysLoaded) {
      // Set loading state
      dispatch({ type: 'SET_VIEWING_KEYS_LOADED', payload: false });
      
      // Load viewing keys for this wallet
      setTimeout(() => {
        // Small delay to show loading state
        dispatch({ type: 'SET_VIEWING_KEYS_LOADED', payload: true });
      }, 100);
    }
  }, [state.walletAddress, state.viewingKeysLoaded]);

  // Enhanced dispatch that handles theme updates
  const enhancedDispatch = useCallback((action: AppAction) => {
    if (action.type === 'SET_THEME') {
      saveTheme(action.payload);
    }
    dispatch(action);
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch: enhancedDispatch,
    getViewingKeys,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 