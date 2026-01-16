import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { Card, CardHeader, CardBody, CardFooter } from "../common/Card";
import { useAppContext } from "../../contexts/AppContext";
import { getViewingKeyFromWallet } from "../../utils/viewingKeys";
import { queryContract } from "../../utils/queryWrapper";
import { Snip20BalanceQuery } from "../../utils/snip20Queries";
import type { Snip20BalanceResponse } from "../../types";

interface AssetInfo {
    address: string;
    symbol: string;
    decimals: number;
}

interface AssetBalanceState {
    address: string;
    symbol: string;
    decimals: number;
    balance: string | null;
    hasViewingKey: boolean;
    isLoading: boolean;
    error: string | null;
}

interface WithdrawSuccessModalProps {
    withdrawnPools: Array<{
        asset0_address: string;
        asset0_symbol: string;
        asset0_decimals: number;
        asset1_address: string;
        asset1_symbol: string;
        asset1_decimals: number;
    }>;
    onClose: () => void;
}

export const WithdrawSuccessModal: React.FC<WithdrawSuccessModalProps> = ({
    withdrawnPools,
    onClose,
}) => {
    const { state } = useAppContext();
    const [assetStates, setAssetStates] = useState<
        Record<string, AssetBalanceState>
    >({});

    // Extract unique assets from withdrawn pools
    const uniqueAssets: AssetInfo[] = React.useMemo(() => {
        const assetMap = new Map<string, AssetInfo>();

        for (const pool of withdrawnPools) {
            if (!assetMap.has(pool.asset0_address)) {
                assetMap.set(pool.asset0_address, {
                    address: pool.asset0_address,
                    symbol: pool.asset0_symbol,
                    decimals: pool.asset0_decimals,
                });
            }
            if (!assetMap.has(pool.asset1_address)) {
                assetMap.set(pool.asset1_address, {
                    address: pool.asset1_address,
                    symbol: pool.asset1_symbol,
                    decimals: pool.asset1_decimals,
                });
            }
        }

        return Array.from(assetMap.values());
    }, [withdrawnPools]);

    const checkAndQueryBalance = async (asset: AssetInfo) => {
        try {
            // Try to get viewing key from Keplr
            const viewingKey = await getViewingKeyFromWallet(asset.address);

            if (viewingKey && state.walletAddress) {
                // Query balance
                try {
                    const query = new Snip20BalanceQuery(
                        state.walletAddress,
                        viewingKey,
                    );
                    const response = await queryContract<Snip20BalanceResponse>(
                        asset.address,
                        query,
                    );

                    if (response?.balance?.amount) {
                        setAssetStates((prev) => ({
                            ...prev,
                            [asset.address]: {
                                ...prev[asset.address],
                                balance: response.balance.amount,
                                hasViewingKey: true,
                                isLoading: false,
                                error: null,
                            },
                        }));
                        return;
                    }
                } catch (queryError) {
                    console.error(
                        `Failed to query balance for ${asset.symbol}:`,
                        queryError,
                    );
                    setAssetStates((prev) => ({
                        ...prev,
                        [asset.address]: {
                            ...prev[asset.address],
                            hasViewingKey: true,
                            isLoading: false,
                            error: "Failed to query balance",
                        },
                    }));
                    return;
                }
            }

            // No viewing key found
            setAssetStates((prev) => ({
                ...prev,
                [asset.address]: {
                    ...prev[asset.address],
                    hasViewingKey: false,
                    isLoading: false,
                    error: null,
                },
            }));
        } catch (error) {
            console.error(
                `Failed to check viewing key for ${asset.symbol}:`,
                error,
            );
            setAssetStates((prev) => ({
                ...prev,
                [asset.address]: {
                    ...prev[asset.address],
                    hasViewingKey: false,
                    isLoading: false,
                    error: null,
                },
            }));
        }
    };

    // Initialize asset states and check for viewing keys
    useEffect(() => {
        const initializeAssets = async () => {
            const initialStates: Record<string, AssetBalanceState> = {};

            for (const asset of uniqueAssets) {
                initialStates[asset.address] = {
                    address: asset.address,
                    symbol: asset.symbol,
                    decimals: asset.decimals,
                    balance: null,
                    hasViewingKey: false,
                    isLoading: true,
                    error: null,
                };
            }

            setAssetStates(initialStates);

            // Check viewing keys and query balances for each asset
            for (const asset of uniqueAssets) {
                await checkAndQueryBalance(asset);
            }
        };

        initializeAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uniqueAssets]);

    const handleAddToKeplr = async (asset: AssetInfo) => {
        if (!window.keplr) {
            console.error("Keplr not found");
            return;
        }

        setAssetStates((prev) => ({
            ...prev,
            [asset.address]: {
                ...prev[asset.address],
                isLoading: true,
                error: null,
            },
        }));

        try {
            // Suggest token to Keplr (this will prompt user to add it)
            await window.keplr.suggestToken("secret-4", asset.address);

            // After adding, query the balance
            await checkAndQueryBalance(asset);
        } catch (error) {
            console.error(`Failed to add ${asset.symbol} to Keplr:`, error);
            setAssetStates((prev) => ({
                ...prev,
                [asset.address]: {
                    ...prev[asset.address],
                    isLoading: false,
                    error: "Failed to add to Keplr",
                },
            }));
        }
    };

    const formatBalance = (balance: string, decimals: number): string => {
        try {
            const num = parseFloat(balance) / Math.pow(10, decimals);
            if (num === 0) return "0";
            if (num < 0.000001) return "< 0.000001";
            return num.toLocaleString("en-US", {
                maximumFractionDigits: 6,
                minimumFractionDigits: 0,
            });
        } catch {
            return "0";
        }
    };

    return (
        <Card style={{ minWidth: "400px", maxWidth: "500px" }}>
            <CardHeader>
                <h3 style={{ margin: 0, textAlign: "center" }}>
                    ✅ Withdrawal Successful!
                </h3>
                <p
                    style={{
                        margin: "0.5rem 0 0 0",
                        textAlign: "center",
                        color: "var(--color-text-secondary)",
                        fontSize: "0.875rem",
                    }}
                >
                    Your underlying assets have been withdrawn
                </p>
            </CardHeader>

            <CardBody>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                    }}
                >
                    {uniqueAssets.map((asset) => {
                        const assetState = assetStates[asset.address];

                        return (
                            <div
                                key={asset.address}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.75rem 1rem",
                                    background: "var(--color-surface-elevated)",
                                    borderRadius: "var(--border-radius-md)",
                                    gap: "1rem",
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    {asset.symbol}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {assetState?.isLoading ? (
                                        <span
                                            style={{
                                                color: "var(--color-text-tertiary)",
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            Loading...
                                        </span>
                                    ) : assetState?.error ? (
                                        <span
                                            style={{
                                                color: "var(--color-error)",
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            {assetState.error}
                                        </span>
                                    ) : assetState?.hasViewingKey &&
                                      assetState?.balance !== null ? (
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: "var(--color-text-primary)",
                                            }}
                                        >
                                            {formatBalance(
                                                assetState.balance,
                                                asset.decimals,
                                            )}
                                        </span>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="small"
                                            onClick={() =>
                                                handleAddToKeplr(asset)
                                            }
                                        >
                                            Add to Keplr
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>

            <CardFooter>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <Button variant="primary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};
