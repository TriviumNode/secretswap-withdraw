export interface RewardPool {
  pool_address: string;
  code_hash: string;
  deposit_token: {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
  };
  reward_token: {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
  };
  disabled: boolean;
}

export interface LiquidityPool {
  pool_address: string;
  lp_token_address: string;
  asset_infos: Array<{
    token?: {
      contract_addr: string;
      token_code_hash: string;
      viewing_key: string;
    };
    native_token?: {
      denom: string;
    };
  }>;
}

export interface PoolBalance {
  pool_address: string;
  balance: string;
  symbol: string;
  decimals: number;
}

export interface ViewingKeyStatus {
  pool_address: string;
  hasValidKey: boolean;
  keySource: 'keplr' | 'signature' | 'none';
  balance?: string;
}

export interface LocalStorageData {
  theme: 'light' | 'dark';
  viewingKeys: Record<string, string[]>; // wallet_address -> pool_addresses_with_keys_set
}

export interface AppState {
  // Wallet
  isWalletConnected: boolean;
  walletAddress: string | null;
  scrtBalance: string;
  
  // Theme
  theme: 'light' | 'dark';
  
  // Migration state
  currentStep: 'info' | 'reward-pools' | 'liquidity-pools' | 'complete';
  permitSignature: string | null;
  
  // Pool data
  rewardPools: RewardPool[];
  selectedPoolAddresses: Set<string>;
  poolBalances: Record<string, PoolBalance>;
  viewingKeyStatuses: Record<string, ViewingKeyStatus>;
  viewingKeysLoaded: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
  modalContent: React.ReactNode | null;
}

export type AppAction = 
  | { type: 'SET_WALLET_CONNECTION'; payload: { address: string; balance: string } }
  | { type: 'DISCONNECT_WALLET' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_STEP'; payload: AppState['currentStep'] }
  | { type: 'SET_PERMIT_SIGNATURE'; payload: string }
  | { type: 'SET_POOL_BALANCES'; payload: Record<string, PoolBalance> }
  | { type: 'SET_VIEWING_KEY_STATUSES'; payload: Record<string, ViewingKeyStatus> }
  | { type: 'SET_VIEWING_KEYS_LOADED'; payload: boolean }
  | { type: 'SAVE_VIEWING_KEYS'; payload: { walletAddress: string; poolAddresses: string[] } }
  | { type: 'TOGGLE_POOL_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_POOLS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SHOW_MODAL'; payload: React.ReactNode }
  | { type: 'HIDE_MODAL' }
  | { type: 'CLEAR_STORAGE_DATA' };

export interface WithdrawResult {
  pool_address: string;
  symbol: string;
  amount: string;
  success: boolean;
  error?: string;
} 