import { queryContract } from "./queryWrapper";
import { Snip20BalanceQuery } from "./snip20Queries";
import { PoolQuery } from "./lpQueries";
import { getViewingKeyFromWallet } from "./viewingKeys";
import type {
    LPPoolDisplayInfo,
    LPViewingKeyStatus,
    LPBalance,
    PoolResponse,
} from "../types";

/** Response type that includes potential viewing key error */
interface Snip20QueryResponse {
    balance?: {
        amount: string;
    };
    viewing_key_error?: {
        msg: string;
    };
}

/** Result of querying LP balances, includes invalid key information */
export interface LPBalanceQueryResult {
    balances: Record<string, LPBalance>;
    invalidKeys: Record<string, { keySource: "keplr" | "signature" }>;
}

/**
 * Calculate user's share of underlying assets based on their LP token balance.
 * Formula: user_asset_amount = (user_lp_balance / total_lp_supply) * pool_asset_reserve
 */
const calculateUnderlyingAssets = (
    userLpBalance: string,
    poolResponse: PoolResponse,
): { asset0Amount: string; asset1Amount: string } => {
    const userBalance = BigInt(userLpBalance);
    const totalShare = BigInt(poolResponse.total_share);

    if (totalShare === BigInt(0)) {
        return { asset0Amount: "0", asset1Amount: "0" };
    }

    const asset0Reserve = BigInt(poolResponse.assets[0].amount);
    const asset1Reserve = BigInt(poolResponse.assets[1].amount);

    // Calculate user's share of each asset
    // Using BigInt arithmetic to avoid precision loss
    const asset0Amount = (userBalance * asset0Reserve) / totalShare;
    const asset1Amount = (userBalance * asset1Reserve) / totalShare;

    return {
        asset0Amount: asset0Amount.toString(),
        asset1Amount: asset1Amount.toString(),
    };
};

/**
 * Query LP token balances for pools that have valid viewing keys.
 * Also queries pool reserves to calculate underlying asset amounts.
 * Uses individual queries for each pool.
 * Returns both balances and information about invalid keys.
 */
export const queryLPBalances = async (
    pools: LPPoolDisplayInfo[],
    viewingKeyStatuses: Record<string, LPViewingKeyStatus>,
    walletAddress: string,
    permitSignature: string | null,
): Promise<LPBalanceQueryResult> => {
    const balances: Record<string, LPBalance> = {};
    const invalidKeys: Record<string, { keySource: "keplr" | "signature" }> =
        {};

    // Filter pools that have valid viewing keys
    const poolsWithKeys = pools.filter((pool) => {
        const status = viewingKeyStatuses[pool.lp_token_address];
        return status?.hasValidKey;
    });

    console.log(
        `Querying LP balances for ${poolsWithKeys.length} pools with valid keys...`,
    );

    for (const pool of poolsWithKeys) {
        try {
            const status = viewingKeyStatuses[pool.lp_token_address];
            let viewingKey: string | undefined;

            // Get the viewing key based on source
            if (status.keySource === "keplr") {
                viewingKey = await getViewingKeyFromWallet(
                    pool.lp_token_address,
                );
            } else if (status.keySource === "signature" && permitSignature) {
                viewingKey = permitSignature;
            }

            if (!viewingKey) {
                console.warn(
                    `No viewing key available for LP ${pool.lp_token_address}`,
                );
                continue;
            }

            // Query the user's LP token balance
            const balanceQuery = new Snip20BalanceQuery(
                walletAddress,
                viewingKey,
            );
            const balanceResponse = await queryContract<Snip20QueryResponse>(
                pool.lp_token_address,
                balanceQuery,
            );

            // Check for viewing key error
            if (balanceResponse?.viewing_key_error) {
                console.warn(
                    `❌ Invalid viewing key for LP ${pool.asset0_symbol}/${pool.asset1_symbol}: ${balanceResponse.viewing_key_error.msg}`,
                );
                invalidKeys[pool.lp_token_address] = {
                    keySource: status.keySource as "keplr" | "signature",
                };
                continue;
            }

            if (balanceResponse?.balance?.amount) {
                const userLpBalance = balanceResponse.balance.amount;

                // Initialize balance object
                const lpBalance: LPBalance = {
                    lp_token_address: pool.lp_token_address,
                    balance: userLpBalance,
                };

                // Only query pool info if user has a balance
                if (hasLPBalance(userLpBalance)) {
                    try {
                        // Query the pool to get reserves and total supply
                        const poolQuery = new PoolQuery();
                        const poolResponse = await queryContract<PoolResponse>(
                            pool.pool_address,
                            poolQuery,
                        );

                        if (poolResponse?.assets && poolResponse?.total_share) {
                            const { asset0Amount, asset1Amount } =
                                calculateUnderlyingAssets(
                                    userLpBalance,
                                    poolResponse,
                                );

                            lpBalance.asset0_amount = asset0Amount;
                            lpBalance.asset1_amount = asset1Amount;
                            lpBalance.total_share = poolResponse.total_share;

                            console.log(
                                `✅ LP ${pool.asset0_symbol}/${pool.asset1_symbol}: ${userLpBalance} LP tokens → ${asset0Amount} ${pool.asset0_symbol}, ${asset1Amount} ${pool.asset1_symbol}`,
                            );
                        } else {
                            console.warn(
                                `Could not get pool info for ${pool.pool_address}`,
                                poolResponse,
                            );
                        }
                    } catch (poolError) {
                        console.warn(
                            `Failed to query pool info for ${pool.pool_address}:`,
                            poolError,
                        );
                        // Still save the LP balance even if pool query fails
                    }
                } else {
                    console.log(
                        `✅ LP ${pool.asset0_symbol}/${pool.asset1_symbol}: 0 balance`,
                    );
                }

                balances[pool.lp_token_address] = lpBalance;
            } else {
                console.warn(
                    `Unexpected response format for LP ${pool.lp_token_address}:`,
                    balanceResponse,
                );
            }
        } catch (error) {
            console.error(
                `Failed to query balance for LP ${pool.lp_token_address}:`,
                error,
            );
            // Continue with other pools even if one fails
        }
    }

    console.log(
        `LP balance query completed. Retrieved ${Object.keys(balances).length} balances, ${Object.keys(invalidKeys).length} invalid keys.`,
    );
    return { balances, invalidKeys };
};

/**
 * Format LP token amount for display.
 * LP tokens typically have 6 decimals.
 */
export const formatLPAmount = (
    amount: string,
    decimals: number = 6,
    maxDecimals: number = 6,
): string => {
    try {
        const num = parseFloat(amount) / Math.pow(10, decimals);
        if (num === 0) return "0";
        if (num < 0.000001) return "< 0.000001";

        return num.toLocaleString("en-US", {
            maximumFractionDigits: maxDecimals,
            minimumFractionDigits: 0,
        });
    } catch {
        return "0";
    }
};

/**
 * Check if an LP balance is greater than zero.
 */
export const hasLPBalance = (balance: string): boolean => {
    try {
        return parseFloat(balance) > 0;
    } catch {
        return false;
    }
};
