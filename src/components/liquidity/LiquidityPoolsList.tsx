import React, { useEffect, useState } from "react";
import { useAppContext } from "../../contexts/AppContext";
import { useKeplr } from "../../hooks/useKeplr";
import { Card, CardHeader, CardBody, CardFooter } from "../common/Card";
import { Button } from "../common/Button";
import { LPPoolRow } from "./LPPoolRow";
import { WithdrawSuccessModal } from "./WithdrawSuccessModal";
import {
    getViewingKeyFromWallet,
    setViewingKeys,
} from "../../utils/viewingKeys";
import { queryLPBalances, hasLPBalance } from "../../utils/lpPoolQueries";
import { getWithdrawLiquidityMessage } from "../../utils/lpExecute";
import type { LPViewingKeyStatus, LPPoolDisplayInfo } from "../../types";

export const LiquidityPoolsList: React.FC = () => {
    const { state, dispatch, getLPViewingKeys } = useAppContext();
    const { connectWallet } = useKeplr();
    const [isSettingKeys, setIsSettingKeys] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const detectLPViewingKeyStatuses = async (
        pools: LPPoolDisplayInfo[],
        savedViewingKeys: string[],
    ): Promise<Record<string, LPViewingKeyStatus>> => {
        const statuses: Record<string, LPViewingKeyStatus> = {};

        for (const pool of pools) {
            const status: LPViewingKeyStatus = {
                lp_token_address: pool.lp_token_address,
                hasValidKey: false,
                keySource: "none",
            };

            // Try to get viewing key from Keplr wallet first
            try {
                const keplrKey = await getViewingKeyFromWallet(
                    pool.lp_token_address,
                );
                if (keplrKey) {
                    status.hasValidKey = true;
                    status.keySource = "keplr";
                    statuses[pool.lp_token_address] = status;
                    continue;
                }
            } catch (error) {
                console.warn(
                    `Failed to get Keplr viewing key for LP ${pool.lp_token_address}:`,
                    error,
                );
            }

            // Check if we have set a viewing key using our permit signature
            if (savedViewingKeys.includes(pool.lp_token_address)) {
                status.hasValidKey = true;
                status.keySource = "signature";
            }

            statuses[pool.lp_token_address] = status;
        }

        return statuses;
    };

    // Load viewing key statuses on mount
    useEffect(() => {
        const loadLPViewingKeyStatuses = async () => {
            dispatch({ type: "SET_LOADING", payload: true });

            try {
                const savedKeys = getLPViewingKeys(state.walletAddress!);
                const statuses = await detectLPViewingKeyStatuses(
                    state.liquidityPools,
                    savedKeys,
                );
                dispatch({
                    type: "SET_LP_VIEWING_KEY_STATUSES",
                    payload: statuses,
                });
                dispatch({ type: "SET_LP_VIEWING_KEYS_LOADED", payload: true });
            } catch (error) {
                console.error("Failed to load LP viewing key statuses:", error);
                dispatch({
                    type: "SET_ERROR",
                    payload: "Failed to check LP viewing keys",
                });
            } finally {
                dispatch({ type: "SET_LOADING", payload: false });
            }
        };

        if (state.walletAddress && !state.lpViewingKeysLoaded) {
            loadLPViewingKeyStatuses();
        }
    }, [
        state.walletAddress,
        state.lpViewingKeysLoaded,
        state.liquidityPools,
        dispatch,
        getLPViewingKeys,
    ]);

    // Query LP balances when viewing key statuses change
    useEffect(() => {
        const loadLPBalances = async () => {
            if (!state.walletAddress) return;

            // Check if there are any pools with valid keys (excluding already known invalid keys)
            const hasPoolsWithKeys = Object.values(
                state.lpViewingKeyStatuses,
            ).some((status) => status.hasValidKey && !status.isInvalidKey);

            if (!hasPoolsWithKeys) {
                console.log("No LP pools with valid viewing keys to query");
                return;
            }

            try {
                const { balances, invalidKeys } = await queryLPBalances(
                    state.liquidityPools,
                    state.lpViewingKeyStatuses,
                    state.walletAddress,
                    state.permitSignature,
                );

                dispatch({ type: "SET_LP_BALANCES", payload: balances });

                // Handle invalid keys
                if (Object.keys(invalidKeys).length > 0) {
                    const updatedStatuses = { ...state.lpViewingKeyStatuses };

                    for (const [
                        lpTokenAddress,
                        { keySource },
                    ] of Object.entries(invalidKeys)) {
                        if (keySource === "keplr") {
                            // Keplr key is invalid - mark as invalid but keep hasValidKey true
                            // so we don't allow setting migration key (user must fix in Keplr)
                            updatedStatuses[lpTokenAddress] = {
                                ...updatedStatuses[lpTokenAddress],
                                isInvalidKey: true,
                            };
                        } else if (keySource === "signature") {
                            // Migration key is invalid - reset to no key state so user can re-set
                            updatedStatuses[lpTokenAddress] = {
                                lp_token_address: lpTokenAddress,
                                hasValidKey: false,
                                keySource: "none",
                                isInvalidKey: true,
                            };
                        }
                    }

                    dispatch({
                        type: "SET_LP_VIEWING_KEY_STATUSES",
                        payload: updatedStatuses,
                    });
                }
            } catch (error) {
                console.error("Failed to query LP balances:", error);
            }
        };

        if (state.lpViewingKeysLoaded) {
            loadLPBalances();
        }
    }, [
        state.lpViewingKeyStatuses,
        state.lpViewingKeysLoaded,
        state.walletAddress,
        state.permitSignature,
        state.liquidityPools,
        dispatch,
    ]);

    const handleSetViewingKeys = async () => {
        if (!state.walletAddress || !state.permitSignature) return;

        setIsSettingKeys(true);
        dispatch({ type: "SET_ERROR", payload: null });

        try {
            const { client } = await connectWallet();

            // Get LP tokens that need viewing keys set
            const lpTokensToSet = Array.from(state.selectedLPAddresses).filter(
                (lpTokenAddress) => {
                    const status = state.lpViewingKeyStatuses[lpTokenAddress];
                    return !status?.hasValidKey;
                },
            );

            if (lpTokensToSet.length === 0) {
                dispatch({
                    type: "SET_ERROR",
                    payload: "No LP tokens selected that need viewing keys",
                });
                return;
            }

            // Set viewing keys for selected LP tokens
            await setViewingKeys(
                client,
                state.walletAddress,
                state.permitSignature,
                lpTokensToSet,
            );

            // Save to localStorage
            const savedKeys = getLPViewingKeys(state.walletAddress);
            const newSavedKeys = [...new Set([...savedKeys, ...lpTokensToSet])];
            dispatch({
                type: "SAVE_LP_VIEWING_KEYS",
                payload: {
                    walletAddress: state.walletAddress,
                    lpTokenAddresses: newSavedKeys,
                },
            });

            // Update viewing key statuses
            const updatedStatuses = { ...state.lpViewingKeyStatuses };
            lpTokensToSet.forEach((lpTokenAddress) => {
                updatedStatuses[lpTokenAddress] = {
                    lp_token_address: lpTokenAddress,
                    hasValidKey: true,
                    keySource: "signature",
                };
            });

            dispatch({
                type: "SET_LP_VIEWING_KEY_STATUSES",
                payload: updatedStatuses,
            });
        } catch (error) {
            console.error("Failed to set LP viewing keys:", error);
            dispatch({
                type: "SET_ERROR",
                payload: "Failed to set viewing keys",
            });
        } finally {
            setIsSettingKeys(false);
        }
    };

    const handleWithdraw = async () => {
        if (!state.walletAddress) return;

        setIsWithdrawing(true);
        dispatch({ type: "SET_ERROR", payload: null });

        try {
            const { client } = await connectWallet();

            // Get selected pools with balances
            const poolsToWithdraw = Array.from(state.selectedLPAddresses)
                .map((lpTokenAddress) => {
                    const pool = state.liquidityPools.find(
                        (p) => p.lp_token_address === lpTokenAddress,
                    );
                    const balance = state.lpBalances[lpTokenAddress];
                    return { pool, balance };
                })
                .filter(
                    ({ balance }) => balance && hasLPBalance(balance.balance),
                );

            if (poolsToWithdraw.length === 0) {
                dispatch({
                    type: "SET_ERROR",
                    payload: "No LP pools selected with valid balances",
                });
                setIsWithdrawing(false);
                return;
            }

            // Create withdrawal messages
            const messages = poolsToWithdraw.map(({ pool, balance }) => {
                return getWithdrawLiquidityMessage({
                    pool_address: pool!.pool_address,
                    lp_token_address: pool!.lp_token_address,
                    lp_token_amount: balance!.balance,
                    wallet_address: state.walletAddress!,
                });
            });

            // Execute withdrawal transaction
            const result = await client.tx.broadcast(messages, {
                gasLimit: messages.length * 300_000 + 100_000,
            });

            if (result.code !== 0) {
                throw new Error(`Transaction failed: ${result.rawLog}`);
            }

            // Build withdrawn pools info for the modal
            const withdrawnPoolsInfo = poolsToWithdraw.map(({ pool }) => ({
                asset0_address: pool!.asset0_address,
                asset0_symbol: pool!.asset0_symbol,
                asset0_decimals: pool!.asset0_decimals,
                asset1_address: pool!.asset1_address,
                asset1_symbol: pool!.asset1_symbol,
                asset1_decimals: pool!.asset1_decimals,
            }));

            // Show success modal with asset balances
            dispatch({
                type: "SHOW_MODAL",
                payload: (
                    <WithdrawSuccessModal
                        withdrawnPools={withdrawnPoolsInfo}
                        onClose={() => dispatch({ type: "HIDE_MODAL" })}
                    />
                ),
            });

            // Clear selections and refresh balances
            dispatch({ type: "SELECT_ALL_LP_POOLS", payload: [] });

            // Re-query balances to update UI
            const { balances } = await queryLPBalances(
                state.liquidityPools,
                state.lpViewingKeyStatuses,
                state.walletAddress,
                state.permitSignature,
            );
            dispatch({ type: "SET_LP_BALANCES", payload: balances });
        } catch (error) {
            console.error("Failed to withdraw from LP pools:", error);
            dispatch({
                type: "SET_ERROR",
                payload: `Failed to withdraw: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleToggleLPSelection = (lpTokenAddress: string) => {
        dispatch({ type: "TOGGLE_LP_SELECTION", payload: lpTokenAddress });
    };

    const handleSelectAll = () => {
        const selectablePools = state.liquidityPools
            .filter((pool) => {
                const status =
                    state.lpViewingKeyStatuses[pool.lp_token_address];
                // Select pools that don't have a key yet (for setting keys)
                return !status?.hasValidKey;
            })
            .map((pool) => pool.lp_token_address);

        dispatch({ type: "SELECT_ALL_LP_POOLS", payload: selectablePools });
    };

    const handleBackToRewards = () => {
        dispatch({ type: "SET_STEP", payload: "reward-pools" });
    };

    const handleComplete = () => {
        dispatch({ type: "SET_STEP", payload: "complete" });
    };

    const getSelectedPoolsNeedingKeys = () => {
        return Array.from(state.selectedLPAddresses).filter(
            (lpTokenAddress) => {
                const status = state.lpViewingKeyStatuses[lpTokenAddress];
                return !status?.hasValidKey;
            },
        );
    };

    const getSelectedPoolsWithBalances = () => {
        return Array.from(state.selectedLPAddresses).filter(
            (lpTokenAddress) => {
                const balance = state.lpBalances[lpTokenAddress];
                return balance && hasLPBalance(balance.balance);
            },
        );
    };

    const poolsNeedingKeys = getSelectedPoolsNeedingKeys();
    const poolsWithBalances = getSelectedPoolsWithBalances();
    const canSetKeys = poolsNeedingKeys.length > 0 && state.permitSignature;
    const canWithdraw =
        poolsNeedingKeys.length === 0 && poolsWithBalances.length > 0;

    // Show loading state while viewing keys are loading
    if (!state.lpViewingKeysLoaded) {
        return (
            <div
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding: "2rem",
                }}
            >
                <Card>
                    <CardBody>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem",
                                padding: "3rem 1rem",
                            }}
                        >
                            <div className="loading-spinner-large" />
                            <p style={{ color: "var(--color-text-secondary)" }}>
                                Loading LP viewing keys for your wallet...
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
            <Card>
                <CardHeader>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h2 style={{ margin: 0 }}>Liquidity Pool Migration</h2>
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={handleSelectAll}
                            disabled={state.isLoading}
                        >
                            Select All Without Keys
                        </Button>
                    </div>
                    <p
                        style={{
                            margin: "0.5rem 0 0 0",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        Select LP pools to withdraw your liquidity and receive
                        the underlying assets.
                    </p>
                </CardHeader>

                <CardBody>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        {state.liquidityPools.map((pool) => (
                            <LPPoolRow
                                key={pool.lp_token_address}
                                pool={pool}
                                viewingKeyStatus={
                                    state.lpViewingKeyStatuses[
                                        pool.lp_token_address
                                    ]
                                }
                                balance={
                                    state.lpBalances[pool.lp_token_address]
                                }
                                isSelected={state.selectedLPAddresses.has(
                                    pool.lp_token_address,
                                )}
                                onToggleSelection={handleToggleLPSelection}
                                disabled={
                                    state.isLoading ||
                                    isSettingKeys ||
                                    isWithdrawing
                                }
                            />
                        ))}
                    </div>
                </CardBody>

                <CardFooter>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {canSetKeys && (
                            <Button
                                variant="secondary"
                                onClick={handleSetViewingKeys}
                                loading={isSettingKeys}
                                disabled={state.isLoading || isWithdrawing}
                            >
                                Set Viewing Keys ({poolsNeedingKeys.length})
                            </Button>
                        )}

                        {canWithdraw && (
                            <Button
                                variant="primary"
                                onClick={handleWithdraw}
                                loading={isWithdrawing}
                                disabled={state.isLoading || isSettingKeys}
                            >
                                Withdraw from LP Pools (
                                {poolsWithBalances.length})
                            </Button>
                        )}

                        <div
                            style={{
                                marginLeft: "auto",
                                fontSize: "0.875rem",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            {state.selectedLPAddresses.size} of{" "}
                            {state.liquidityPools.length} LP pools selected
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "1rem",
                            paddingTop: "1rem",
                            borderTop: "1px solid var(--color-border)",
                        }}
                    >
                        <Button
                            variant="secondary"
                            onClick={handleBackToRewards}
                            disabled={
                                state.isLoading ||
                                isSettingKeys ||
                                isWithdrawing
                            }
                        >
                            ← Back to Reward Pools
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleComplete}
                            disabled={
                                state.isLoading ||
                                isSettingKeys ||
                                isWithdrawing
                            }
                        >
                            Complete Migration →
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};
