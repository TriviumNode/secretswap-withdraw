export interface RewardPool {
    pool_address: string;
    code_hash: string;
    name?: string;
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
    lp_token_code_hash?: string;
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

export interface LPPoolDisplayInfo {
    pool_address: string;
    lp_token_address: string;
    asset0_symbol: string;
    asset1_symbol: string;
    asset0_address: string;
    asset1_address: string;
    asset0_decimals: number;
    asset1_decimals: number;
}

export interface LPViewingKeyStatus {
    lp_token_address: string;
    hasValidKey: boolean;
    keySource: "keplr" | "signature" | "none";
    /** Set when the key exists but is incorrect */
    isInvalidKey?: boolean;
}

export interface LPBalance {
    lp_token_address: string;
    balance: string;
    /** User's claimable amount of asset 0 */
    asset0_amount?: string;
    /** User's claimable amount of asset 1 */
    asset1_amount?: string;
    /** Total LP tokens in the pool */
    total_share?: string;
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
    keySource: "keplr" | "signature" | "none";
    balance?: string;
}

export interface LocalStorageData {
    theme: "light" | "dark";
    viewingKeys: Record<string, string[]>; // wallet_address -> pool_addresses_with_keys_set
}

export interface AppState {
    // Wallet
    isWalletConnected: boolean;
    walletAddress: string | null;
    scrtBalance: string;

    // Theme
    theme: "light" | "dark";

    // Migration state
    currentStep: "info" | "reward-pools" | "liquidity-pools" | "complete";
    permitSignature: string | null;

    // Reward Pool data
    rewardPools: RewardPool[];
    selectedPoolAddresses: Set<string>;
    poolBalances: Record<string, PoolBalance>;
    viewingKeyStatuses: Record<string, ViewingKeyStatus>;
    viewingKeysLoaded: boolean;

    // Liquidity Pool data
    liquidityPools: LPPoolDisplayInfo[];
    selectedLPAddresses: Set<string>;
    lpViewingKeyStatuses: Record<string, LPViewingKeyStatus>;
    lpBalances: Record<string, LPBalance>;
    lpViewingKeysLoaded: boolean;

    // UI state
    isLoading: boolean;
    error: string | null;
    showModal: boolean;
    modalContent: React.ReactNode | null;
}

export type AppAction =
    | {
          type: "SET_WALLET_CONNECTION";
          payload: { address: string; balance: string };
      }
    | { type: "DISCONNECT_WALLET" }
    | { type: "SET_THEME"; payload: "light" | "dark" }
    | { type: "SET_STEP"; payload: AppState["currentStep"] }
    | { type: "SET_PERMIT_SIGNATURE"; payload: string }
    | { type: "SET_POOL_BALANCES"; payload: Record<string, PoolBalance> }
    | {
          type: "SET_VIEWING_KEY_STATUSES";
          payload: Record<string, ViewingKeyStatus>;
      }
    | { type: "SET_VIEWING_KEYS_LOADED"; payload: boolean }
    | {
          type: "SAVE_VIEWING_KEYS";
          payload: { walletAddress: string; poolAddresses: string[] };
      }
    | { type: "TOGGLE_POOL_SELECTION"; payload: string }
    | { type: "SELECT_ALL_POOLS"; payload: string[] }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SHOW_MODAL"; payload: React.ReactNode }
    | { type: "HIDE_MODAL" }
    | { type: "CLEAR_STORAGE_DATA" }
    // LP Pool actions
    | { type: "TOGGLE_LP_SELECTION"; payload: string }
    | { type: "SELECT_ALL_LP_POOLS"; payload: string[] }
    | {
          type: "SET_LP_VIEWING_KEY_STATUSES";
          payload: Record<string, LPViewingKeyStatus>;
      }
    | { type: "SET_LP_BALANCES"; payload: Record<string, LPBalance> }
    | { type: "SET_LP_VIEWING_KEYS_LOADED"; payload: boolean }
    | {
          type: "SAVE_LP_VIEWING_KEYS";
          payload: { walletAddress: string; lpTokenAddresses: string[] };
      };

export interface WithdrawResult {
    pool_address: string;
    symbol: string;
    amount: string;
    success: boolean;
    error?: string;
}

// LP Pool Types

export type AssetInfo =
    | {
          token: {
              contract_addr: string;
              token_code_hash: string;
              viewing_key: string;
          };
      }
    | {
          native_token: {
              denom: string;
          };
      };

export interface Asset {
    info: AssetInfo;
    amount: string;
}

export interface Factory {
    address: string;
    code_hash: string;
}

export interface PoolResponse {
    assets: [Asset, Asset];
    total_share: string;
}

export interface PairInfo {
    asset_infos: [AssetInfo, AssetInfo];
    contract_addr: string;
    liquidity_token: string;
    token_code_hash: string;
    asset0_volume: string;
    asset1_volume: string;
    factory: Factory;
}

// SNIP20 Types

export interface Snip20BalanceResponse {
    balance: {
        amount: string;
    };
}
