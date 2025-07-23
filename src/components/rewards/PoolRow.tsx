import React from 'react';
import type { RewardPool, PoolBalance, ViewingKeyStatus } from '../../types';
import { formatTokenAmount, hasValidBalance } from '../../utils/poolQueries';
import '../../styles/components.css';

interface PoolRowProps {
  pool: RewardPool;
  balance?: PoolBalance;
  viewingKeyStatus?: ViewingKeyStatus;
  isSelected: boolean;
  onToggleSelection: (poolAddress: string) => void;
  disabled?: boolean;
}

export const PoolRow: React.FC<PoolRowProps> = ({
  pool,
  balance,
  viewingKeyStatus,
  isSelected,
  onToggleSelection,
  disabled = false,
}) => {
  const hasBalance = balance && hasValidBalance(balance.balance);
  const canSelect = viewingKeyStatus?.hasValidKey && !hasBalance ? false : true;

  const getStatusInfo = () => {
    if (!viewingKeyStatus) {
      return { text: 'Checking...', className: 'status-pending' };
    }

    if (viewingKeyStatus.hasValidKey) {
      const sourceText = viewingKeyStatus.keySource === 'keplr' ? 'Keplr Key' : 'Migration Key';
      return { text: sourceText, className: 'status-valid' };
    }

    return { text: 'No Key', className: 'status-invalid' };
  };

  const statusInfo = getStatusInfo();

  const poolType = pool.reward_token.symbol === 'sSCRT' ? 'Bridge Staking' : 'Secret Swap Staking'

  return (
    <div className={`pool-row ${disabled ? 'disabled' : ''}`}>
      {/* Checkbox */}
      <div className="checkbox-container" style={{cursor: canSelect ? 'pointer' : 'not-allowed'}} onClick={() => canSelect && onToggleSelection(pool.pool_address)}>
        <input
          type="checkbox"
          className="checkbox"
          checked={isSelected}
          onChange={() => {}} // Handled by container click
          disabled={!canSelect}
        />
      </div>

      {/* Pool Info */}
      <div className="pool-info">
        <div className="pool-symbol">
          {poolType}: {pool.deposit_token.symbol}
        </div>
        <div className="pool-balance">
          {balance ? (
            hasBalance ? (
              `${formatTokenAmount(balance.balance, balance.decimals)} ${balance.symbol}`
            ) : (
              'No balance'
            )
          ) : viewingKeyStatus?.hasValidKey ? (
            'Loading balance...'
          ) : (
            'Select this pool to create a viewing key.'
          )}
        </div>
        {/* {pool.disabled && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--color-warning)',
            fontWeight: '500'
          }}>
            Emergency withdrawal required
          </div>
        )} */}
      </div>

      {/* Status */}
      <div className="pool-status">
        <div className={`status-dot ${statusInfo.className}`} />
        <span>{statusInfo.text}</span>
      </div>
    </div>
  );
}; 