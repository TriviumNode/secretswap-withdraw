import React, {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useCallback,
} from "react";
import type { ReactNode } from "react";
import type {
    AppState,
    AppAction,
    RewardPool,
    LPPoolDisplayInfo,
} from "../types";
import rewardPoolsData from "../data/reward_pools.json";
import liquidityPoolsData from "../data/liquidity_pools.json";
import bridgeTokensData from "../data/bridge_tokens.json";
import secretTokensData from "../data/secret_tokens.json";
import { sortRewardPools } from "../utils/poolQueries";

// Token info including symbol and decimals
interface TokenInfo {
    symbol: string;
    decimals: number;
}

// Build a token lookup map from address to token info
const buildTokenLookup = (): Record<string, TokenInfo> => {
    const lookup: Record<string, TokenInfo> = {};

    // Add bridge tokens
    for (const token of bridgeTokensData as Array<{
        address: string;
        symbol: string;
        decimals: number;
    }>) {
        lookup[token.address] = {
            symbol: token.symbol,
            decimals: token.decimals,
        };
    }

    // Add secret tokens (these may include LP tokens and other tokens)
    for (const token of secretTokensData as Array<{
        address: string;
        name: string;
        decimals: number;
    }>) {
        // Use name as symbol for secret tokens if not already in lookup
        if (!lookup[token.address]) {
            lookup[token.address] = {
                symbol: token.name,
                decimals: token.decimals,
            };
        }
    }

    // Add tokens from reward pools (deposit_token and reward_token)
    // This catches tokens like sSCRT that may not be in the other lists
    for (const pool of rewardPoolsData as Array<{
        deposit_token: { address: string; symbol: string; decimals: number };
        reward_token: { address: string; symbol: string; decimals: number };
    }>) {
        if (!lookup[pool.deposit_token.address]) {
            lookup[pool.deposit_token.address] = {
                symbol: pool.deposit_token.symbol,
                decimals: pool.deposit_token.decimals,
            };
        }
        if (!lookup[pool.reward_token.address]) {
            lookup[pool.reward_token.address] = {
                symbol: pool.reward_token.symbol,
                decimals: pool.reward_token.decimals,
            };
        }
    }

    return lookup;
};

// Build LP pool display info with resolved symbols and decimals
const buildLPPoolDisplayInfo = (): LPPoolDisplayInfo[] => {
    const tokenLookup = buildTokenLookup();

    return (
        liquidityPoolsData as Array<{
            pool_address: string;
            lp_token_address: string;
            asset_infos: Array<{
                token?: { contract_addr: string };
                native_token?: { denom: string };
            }>;
        }>
    ).map((pool) => {
        const asset0 = pool.asset_infos[0];
        const asset1 = pool.asset_infos[1];

        const asset0_address =
            asset0.token?.contract_addr || asset0.native_token?.denom || "";
        const asset1_address =
            asset1.token?.contract_addr || asset1.native_token?.denom || "";

        // Resolve token info from lookup
        const asset0_info = asset0.native_token?.denom
            ? { symbol: asset0.native_token.denom.toUpperCase(), decimals: 6 } // Native tokens typically have 6 decimals
            : tokenLookup[asset0_address] || {
                  symbol: `${asset0_address.slice(0, 10)}...`,
                  decimals: 6,
              };

        const asset1_info = asset1.native_token?.denom
            ? { symbol: asset1.native_token.denom.toUpperCase(), decimals: 6 }
            : tokenLookup[asset1_address] || {
                  symbol: `${asset1_address.slice(0, 10)}...`,
                  decimals: 6,
              };

        return {
            pool_address: pool.pool_address,
            lp_token_address: pool.lp_token_address,
            asset0_symbol: asset0_info.symbol,
            asset1_symbol: asset1_info.symbol,
            asset0_address,
            asset1_address,
            asset0_decimals: asset0_info.decimals,
            asset1_decimals: asset1_info.decimals,
        };
    });
};

// Storage keys
const THEME_STORAGE_KEY = "secretswap-migration-theme";
const VIEWING_KEYS_STORAGE_KEY = "secretswap-migration-viewing-keys";
const LP_VIEWING_KEYS_STORAGE_KEY = "secretswap-migration-lp-viewing-keys";

// Initial state
const initialState: AppState = {
    // Wallet
    isWalletConnected: false,
    walletAddress: null,
    scrtBalance: "0",

    // Theme
    theme: "light",

    // Migration state
    currentStep: "info",
    permitSignature: null,

    // Reward Pool data
    rewardPools: sortRewardPools(rewardPoolsData as RewardPool[]),
    selectedPoolAddresses: new Set(),
    poolBalances: {},
    viewingKeyStatuses: {},
    viewingKeysLoaded: false,

    // Liquidity Pool data
    liquidityPools: buildLPPoolDisplayInfo(),
    selectedLPAddresses: new Set(),
    lpViewingKeyStatuses: {},
    lpBalances: {},
    lpViewingKeysLoaded: false,

    // UI state
    isLoading: false,
    error: null,
    showModal: false,
    modalContent: null,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case "SET_WALLET_CONNECTION":
            return {
                ...state,
                isWalletConnected: true,
                walletAddress: action.payload.address,
                scrtBalance: action.payload.balance,
                error: null,
            };

        case "DISCONNECT_WALLET":
            return {
                ...state,
                isWalletConnected: false,
                walletAddress: null,
                scrtBalance: "0",
                permitSignature: null,
                selectedPoolAddresses: new Set(),
                poolBalances: {},
                viewingKeyStatuses: {},
                viewingKeysLoaded: false,
                selectedLPAddresses: new Set(),
                lpViewingKeyStatuses: {},
                lpBalances: {},
                lpViewingKeysLoaded: false,
                currentStep: "info",
            };

        case "SET_THEME":
            return {
                ...state,
                theme: action.payload,
            };

        case "SET_STEP":
            return {
                ...state,
                currentStep: action.payload,
            };

        case "SET_PERMIT_SIGNATURE":
            return {
                ...state,
                permitSignature: action.payload,
            };

        case "SET_POOL_BALANCES":
            return {
                ...state,
                poolBalances: action.payload,
            };

        case "SET_VIEWING_KEY_STATUSES":
            return {
                ...state,
                viewingKeyStatuses: action.payload,
            };

        case "SET_VIEWING_KEYS_LOADED":
            return {
                ...state,
                viewingKeysLoaded: action.payload,
            };

        case "SAVE_VIEWING_KEYS": {
            // Save to localStorage
            try {
                const stored = localStorage.getItem(VIEWING_KEYS_STORAGE_KEY);
                const viewingKeysData = stored ? JSON.parse(stored) : {};
                viewingKeysData[action.payload.walletAddress] =
                    action.payload.poolAddresses;
                localStorage.setItem(
                    VIEWING_KEYS_STORAGE_KEY,
                    JSON.stringify(viewingKeysData),
                );
            } catch (error) {
                console.error(
                    "Failed to save viewing keys to localStorage:",
                    error,
                );
            }
            return state;
        }

        case "CLEAR_STORAGE_DATA":
            try {
                localStorage.removeItem(THEME_STORAGE_KEY);
                localStorage.removeItem(VIEWING_KEYS_STORAGE_KEY);
                localStorage.removeItem(LP_VIEWING_KEYS_STORAGE_KEY);
            } catch (error) {
                console.error("Failed to clear localStorage:", error);
            }
            return {
                ...initialState,
                theme: "light",
                rewardPools: state.rewardPools, // Keep pools data
                liquidityPools: state.liquidityPools, // Keep LP pools data
            };

        case "TOGGLE_POOL_SELECTION": {
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

        case "SELECT_ALL_POOLS":
            return {
                ...state,
                selectedPoolAddresses: new Set(action.payload),
            };

        case "SET_LOADING":
            return {
                ...state,
                isLoading: action.payload,
            };

        case "SET_ERROR":
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };

        case "SHOW_MODAL":
            return {
                ...state,
                showModal: true,
                modalContent: action.payload,
            };

        case "HIDE_MODAL":
            return {
                ...state,
                showModal: false,
                modalContent: null,
            };

        // LP Pool actions
        case "TOGGLE_LP_SELECTION": {
            const newSelection = new Set(state.selectedLPAddresses);
            if (newSelection.has(action.payload)) {
                newSelection.delete(action.payload);
            } else {
                newSelection.add(action.payload);
            }
            return {
                ...state,
                selectedLPAddresses: newSelection,
            };
        }

        case "SELECT_ALL_LP_POOLS":
            return {
                ...state,
                selectedLPAddresses: new Set(action.payload),
            };

        case "SET_LP_VIEWING_KEY_STATUSES":
            return {
                ...state,
                lpViewingKeyStatuses: action.payload,
            };

        case "SET_LP_BALANCES":
            return {
                ...state,
                lpBalances: action.payload,
            };

        case "SET_LP_VIEWING_KEYS_LOADED":
            return {
                ...state,
                lpViewingKeysLoaded: action.payload,
            };

        case "SAVE_LP_VIEWING_KEYS": {
            // Save to localStorage
            try {
                const stored = localStorage.getItem(
                    LP_VIEWING_KEYS_STORAGE_KEY,
                );
                const viewingKeysData = stored ? JSON.parse(stored) : {};
                viewingKeysData[action.payload.walletAddress] =
                    action.payload.lpTokenAddresses;
                localStorage.setItem(
                    LP_VIEWING_KEYS_STORAGE_KEY,
                    JSON.stringify(viewingKeysData),
                );
            } catch (error) {
                console.error(
                    "Failed to save LP viewing keys to localStorage:",
                    error,
                );
            }
            return state;
        }

        default:
            return state;
    }
};

// localStorage functions
const loadTheme = (): "light" | "dark" => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return stored === "dark" ? "dark" : "light";
    } catch (error) {
        console.error("Failed to load theme from localStorage:", error);
        return "light";
    }
};

const saveTheme = (theme: "light" | "dark") => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.error("Failed to save theme to localStorage:", error);
    }
};

const getViewingKeys = (walletAddress: string): string[] => {
    try {
        const stored = localStorage.getItem(VIEWING_KEYS_STORAGE_KEY);
        if (!stored) return [];
        const viewingKeysData = JSON.parse(stored);
        return viewingKeysData[walletAddress] || [];
    } catch (error) {
        console.error("Failed to load viewing keys from localStorage:", error);
        return [];
    }
};

const getLPViewingKeys = (walletAddress: string): string[] => {
    try {
        const stored = localStorage.getItem(LP_VIEWING_KEYS_STORAGE_KEY);
        if (!stored) return [];
        const viewingKeysData = JSON.parse(stored);
        return viewingKeysData[walletAddress] || [];
    } catch (error) {
        console.error(
            "Failed to load LP viewing keys from localStorage:",
            error,
        );
        return [];
    }
};

// Context creation
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    getViewingKeys: (walletAddress: string) => string[];
    getLPViewingKeys: (walletAddress: string) => string[];
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
        dispatch({ type: "SET_THEME", payload: savedTheme });
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    // Update document theme when state changes
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", state.theme);
    }, [state.theme]);

    // Load viewing keys after wallet connection
    useEffect(() => {
        if (state.walletAddress && !state.viewingKeysLoaded) {
            // Set loading state
            dispatch({ type: "SET_VIEWING_KEYS_LOADED", payload: false });

            // Load viewing keys for this wallet
            setTimeout(() => {
                // Small delay to show loading state
                dispatch({ type: "SET_VIEWING_KEYS_LOADED", payload: true });
            }, 100);
        }
    }, [state.walletAddress, state.viewingKeysLoaded]);

    // Enhanced dispatch that handles theme updates
    const enhancedDispatch = useCallback((action: AppAction) => {
        if (action.type === "SET_THEME") {
            saveTheme(action.payload);
        }
        dispatch(action);
    }, []);

    const contextValue: AppContextType = {
        state,
        dispatch: enhancedDispatch,
        getViewingKeys,
        getLPViewingKeys,
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
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};
