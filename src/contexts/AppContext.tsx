import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, RewardPool } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import rewardPoolsData from '../data/reward_pools.json';

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

// Context creation
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { theme, updateTheme } = useLocalStorage();

  // Initialize theme from localStorage
  useEffect(() => {
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Update document theme when state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Enhanced dispatch that handles theme updates
  const enhancedDispatch = useCallback((action: AppAction) => {
    if (action.type === 'SET_THEME') {
      updateTheme(action.payload);
    }
    dispatch(action);
  }, [updateTheme]);

  const contextValue: AppContextType = {
    state,
    dispatch: enhancedDispatch,
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