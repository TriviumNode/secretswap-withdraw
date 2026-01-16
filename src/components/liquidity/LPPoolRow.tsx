import React from "react";
import type {
    LPPoolDisplayInfo,
    LPViewingKeyStatus,
    LPBalance,
} from "../../types";
import { formatLPAmount, hasLPBalance } from "../../utils/lpPoolQueries";
import "../../styles/components.css";

interface LPPoolRowProps {
    pool: LPPoolDisplayInfo;
    viewingKeyStatus?: LPViewingKeyStatus;
    balance?: LPBalance;
    isSelected: boolean;
    onToggleSelection: (lpTokenAddress: string) => void;
    disabled?: boolean;
}

export const LPPoolRow: React.FC<LPPoolRowProps> = ({
    pool,
    viewingKeyStatus,
    balance,
    isSelected,
    onToggleSelection,
    disabled = false,
}) => {
    const hasBalance = balance && hasLPBalance(balance.balance);
    const hasInvalidKeplrKey =
        viewingKeyStatus?.isInvalidKey &&
        viewingKeyStatus?.keySource === "keplr";
    const hasInvalidMigrationKey =
        viewingKeyStatus?.isInvalidKey &&
        viewingKeyStatus?.keySource === "none";

    // Determine if pool can be selected:
    // - Can select if no key (to set one)
    // - Can select if has invalid migration key (to re-set)
    // - Can select if has valid key with balance (to withdraw)
    // - Cannot select if has valid key with no balance
    // - Cannot select if has invalid Keplr key (must fix in Keplr)
    const canSelect = (() => {
        if (hasInvalidKeplrKey) return false;
        if (!viewingKeyStatus?.hasValidKey) return true; // No key, can select to set one
        if (hasBalance) return true; // Has balance, can select to withdraw
        return false; // Has key but no balance
    })();

    const getStatusInfo = () => {
        if (!viewingKeyStatus) {
            return { text: "Checking...", className: "status-pending" };
        }

        // Invalid Keplr key - use warning (yellow) to stand out
        if (hasInvalidKeplrKey) {
            return {
                text: "Invalid Keplr Key",
                className: "status-warning-pulse",
            };
        }

        // Invalid migration key (now shows as no key since it was reset)
        if (hasInvalidMigrationKey) {
            return { text: "Invalid Key", className: "status-invalid" };
        }

        if (viewingKeyStatus.hasValidKey) {
            const sourceText =
                viewingKeyStatus.keySource === "keplr"
                    ? "Keplr Key"
                    : "Migration Key";
            return { text: sourceText, className: "status-valid" };
        }

        return { text: "No Key", className: "status-invalid" };
    };

    const formatAssetAmount = (amount: string, decimals: number): string => {
        return formatLPAmount(amount, decimals, 6);
    };

    const getBalanceDisplay = (): React.ReactNode => {
        // Invalid Keplr key - show error message
        if (hasInvalidKeplrKey) {
            return "Fix viewing key in Keplr wallet";
        }

        // Invalid migration key - allow re-setting
        if (hasInvalidMigrationKey) {
            return "Select to re-set viewing key";
        }

        if (!viewingKeyStatus?.hasValidKey) {
            return "Select to create a viewing key";
        }

        if (balance) {
            if (hasBalance) {
                // Check if we have underlying asset amounts
                if (balance.asset0_amount && balance.asset1_amount) {
                    const asset0Formatted = formatAssetAmount(
                        balance.asset0_amount,
                        pool.asset0_decimals,
                    );
                    const asset1Formatted = formatAssetAmount(
                        balance.asset1_amount,
                        pool.asset1_decimals,
                    );

                    return (
                        <span>
                            <span
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {formatLPAmount(balance.balance)} LP →{" "}
                            </span>
                            <span style={{ fontWeight: 500 }}>
                                {asset0Formatted} {pool.asset0_symbol}
                            </span>
                            <span
                                style={{ color: "var(--color-text-tertiary)" }}
                            >
                                {" "}
                                +{" "}
                            </span>
                            <span style={{ fontWeight: 500 }}>
                                {asset1Formatted} {pool.asset1_symbol}
                            </span>
                        </span>
                    );
                }
                // Fallback to just LP token amount if pool query failed
                return `${formatLPAmount(balance.balance)} LP tokens`;
            }
            return "No balance";
        }

        return "Loading balance...";
    };

    const statusInfo = getStatusInfo();
    const isDev = import.meta.env.DEV;

    return (
        <div
            className={`pool-row ${disabled ? "disabled" : ""} ${hasBalance ? "pool-row-highlighted" : ""}`}
            style={{
                flexDirection: isDev && hasBalance ? "column" : undefined,
                alignItems: isDev && hasBalance ? "stretch" : undefined,
            }}
        >
            <div
                style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
                {/* Checkbox */}
                <div
                    className="checkbox-container"
                    style={{
                        cursor:
                            canSelect && !disabled ? "pointer" : "not-allowed",
                    }}
                    onClick={() =>
                        canSelect &&
                        !disabled &&
                        onToggleSelection(pool.lp_token_address)
                    }
                >
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container click
                        disabled={!canSelect || disabled}
                    />
                </div>

                {/* Pool Info */}
                <div className="pool-info">
                    <div className="pool-symbol">
                        LP: {pool.asset0_symbol} / {pool.asset1_symbol}
                    </div>
                    <div className="pool-balance">{getBalanceDisplay()}</div>
                </div>

                {/* Status */}
                <div className="pool-status">
                    <span>{statusInfo.text}</span>
                    <div className={`status-dot ${statusInfo.className}`} />
                </div>
            </div>

            {/* Debug info in development mode */}
            {isDev && hasBalance && (
                <div
                    style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem",
                        background: "var(--color-surface-elevated)",
                        borderRadius: "var(--border-radius-sm)",
                        fontSize: "0.7rem",
                        fontFamily: "monospace",
                        color: "var(--color-text-tertiary)",
                        lineHeight: 1.4,
                    }}
                >
                    <div>
                        <strong>🔧 Debug Info:</strong>
                    </div>
                    <div>Pool Address: {pool.pool_address}</div>
                    <div>LP Token Address: {pool.lp_token_address}</div>
                    <div>Asset 0 Address: {pool.asset0_address}</div>
                    <div>Asset 1 Address: {pool.asset1_address}</div>
                    <div style={{ marginTop: "0.25rem" }}>
                        <strong>User LP Balance (raw):</strong>{" "}
                        {balance?.balance}
                    </div>
                    <div>
                        <strong>Total LP Supply (raw):</strong>{" "}
                        {balance?.total_share || "N/A"}
                    </div>
                    <div style={{ marginTop: "0.25rem" }}>
                        <strong>Asset 0 ({pool.asset0_symbol}):</strong>
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Decimals: {pool.asset0_decimals}
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Raw Amount: {balance?.asset0_amount || "N/A"}
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Formatted:{" "}
                        {balance?.asset0_amount
                            ? formatAssetAmount(
                                  balance.asset0_amount,
                                  pool.asset0_decimals,
                              )
                            : "N/A"}
                    </div>
                    <div style={{ marginTop: "0.25rem" }}>
                        <strong>Asset 1 ({pool.asset1_symbol}):</strong>
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Decimals: {pool.asset1_decimals}
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Raw Amount: {balance?.asset1_amount || "N/A"}
                    </div>
                    <div style={{ paddingLeft: "1rem" }}>
                        Formatted:{" "}
                        {balance?.asset1_amount
                            ? formatAssetAmount(
                                  balance.asset1_amount,
                                  pool.asset1_decimals,
                              )
                            : "N/A"}
                    </div>
                </div>
            )}
        </div>
    );
};
