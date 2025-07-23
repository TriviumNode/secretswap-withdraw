import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useKeplr } from '../../hooks/useKeplr';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card';
import { Button } from '../common/Button';
import { PoolRow } from './PoolRow';
import { detectViewingKeyStatuses, batchQueryPoolBalances, hasValidBalance } from '../../utils/poolQueries';
import { setViewingKeys } from '../../utils/viewingKeys';
import { getRewardRedeemMessage, getRewardEmergencyRedeemMessage } from '../../utils/rewardExecutes';
import type { WithdrawResult } from '../../types';

export const RewardPoolsList: React.FC = () => {
  const { state, dispatch, getViewingKeys } = useAppContext();
  const { connectWallet } = useKeplr();
  const [isSettingKeys, setIsSettingKeys] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load viewing key statuses on mount after viewing keys are loaded
  useEffect(() => {
    if (!state.walletAddress || !state.viewingKeysLoaded) return;
    loadViewingKeyStatuses();
  }, [state.walletAddress, state.permitSignature, state.viewingKeysLoaded]);

  useEffect(()=>{
    queryPoolBalances()
  }, [state.viewingKeyStatuses])

  const loadViewingKeyStatuses = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const savedKeys = getViewingKeys(state.walletAddress!);
      const statuses = await detectViewingKeyStatuses(
        state.rewardPools,
        state.walletAddress!,
        state.permitSignature,
        savedKeys
      );
      dispatch({ type: 'SET_VIEWING_KEY_STATUSES', payload: statuses });

      // Query balances for pools with valid keys
      // await queryPoolBalances(); // Handled by effect
    } catch (error) {
      console.error('Failed to load viewing key statuses:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to check viewing keys' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const queryPoolBalances = async () => {
    if (!state.walletAddress) return;

    try {
      const balances = await batchQueryPoolBalances(
        state.rewardPools,
        state.viewingKeyStatuses,
        state.walletAddress,
        state.permitSignature
      );
      
      dispatch({ type: 'SET_POOL_BALANCES', payload: balances });
    } catch (error) {
      console.error('Failed to query pool balances:', error);
    }
  };

  const handleSetViewingKeys = async () => {
    if (!state.walletAddress || !state.permitSignature) return;

    setIsSettingKeys(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { client } = await connectWallet();
      
      // Get pools that need viewing keys set
      const poolsToSet = Array.from(state.selectedPoolAddresses).filter(poolAddress => {
        const pool = state.rewardPools.find(p => p.pool_address === poolAddress);
        const status = state.viewingKeyStatuses[poolAddress];
        return pool && !pool.disabled && !status?.hasValidKey;
      });

      if (poolsToSet.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No pools selected that need viewing keys' });
        return;
      }

      // Set viewing keys for selected pools
      await setViewingKeys(client, state.walletAddress, state.permitSignature, poolsToSet);

      // Save to localStorage
      const savedKeys = getViewingKeys(state.walletAddress);
      const newSavedKeys = [...new Set([...savedKeys, ...poolsToSet])];
      dispatch({ 
        type: 'SAVE_VIEWING_KEYS', 
        payload: { walletAddress: state.walletAddress, poolAddresses: newSavedKeys }
      });

      // Update viewing key statuses
      const updatedStatuses = { ...state.viewingKeyStatuses };
      poolsToSet.forEach(poolAddress => {
        updatedStatuses[poolAddress] = {
          pool_address: poolAddress,
          hasValidKey: true,
          keySource: 'signature'
        };
      });
      
      dispatch({ type: 'SET_VIEWING_KEY_STATUSES', payload: updatedStatuses });

      // Query balances for newly accessible pools
      await queryPoolBalances();

    } catch (error) {
      console.error('Failed to set viewing keys:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to set viewing keys' });
    } finally {
      setIsSettingKeys(false);
    }
  };

  const handleWithdraw = async () => {
    if (!state.walletAddress) return;

    setIsWithdrawing(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { client } = await connectWallet();
      
      // Get selected pools with balances
      const poolsToWithdraw = Array.from(state.selectedPoolAddresses)
        .map(poolAddress => {
          const pool = state.rewardPools.find(p => p.pool_address === poolAddress);
          const balance = state.poolBalances[poolAddress];
          return { pool, balance };
        })
        .filter(({ pool, balance }) => 
          pool && (pool.disabled || (balance && hasValidBalance(balance.balance)))
        );

      if (poolsToWithdraw.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No pools selected with valid balances' });
        return;
      }

      // Create withdrawal messages
      const messages = poolsToWithdraw.map(({ pool, balance }) => {
        if (pool!.disabled) {
          return getRewardEmergencyRedeemMessage(state.walletAddress!, pool!.pool_address);
        } else {
          return getRewardRedeemMessage(state.walletAddress!, pool!.pool_address, balance!.balance);
        }
      });

      // Execute withdrawal transaction
      const result = await client.tx.broadcast(messages, {
        gasLimit: messages.length * 200_000 + 100_000,
      });

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // TODO: Parse transaction results to get actual withdrawal amounts
      // const withdrawResults: WithdrawResult[] = poolsToWithdraw.map(({ pool, balance }) => ({
      //   pool_address: pool!.pool_address,
      //   symbol: balance!.symbol,
      //   amount: balance!.balance,
      //   success: true
      // }));

      // Show success modal with results
      dispatch({ 
        type: 'SHOW_MODAL', 
        // payload: <WithdrawSummary results={withdrawResults} />
        payload: <div style={{padding: '32px', textAlign: 'center'}}>Withdraw Successful!</div>
      });

      // Clear selections and refresh balances
      dispatch({ type: 'SELECT_ALL_POOLS', payload: [] });
      await queryPoolBalances();

    } catch (error) {
      console.error('Failed to withdraw:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process withdrawals' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleTogglePoolSelection = (poolAddress: string) => {
    dispatch({ type: 'TOGGLE_POOL_SELECTION', payload: poolAddress });
  };

  const handleSelectAll = () => {
    const selectablePools = state.rewardPools
      .filter(pool => {
        const status = state.viewingKeyStatuses[pool.pool_address];
        const balance = state.poolBalances[pool.pool_address];
        const hasBalance = balance && hasValidBalance(balance.balance);
        return !status.hasValidKey || hasBalance;
      })
      .map(pool => pool.pool_address);
    
    dispatch({ type: 'SELECT_ALL_POOLS', payload: selectablePools });
  };

  const getSelectedPoolsNeedingKeys = () => {
    return Array.from(state.selectedPoolAddresses).filter(poolAddress => {
      const pool = state.rewardPools.find(p => p.pool_address === poolAddress);
      const status = state.viewingKeyStatuses[poolAddress];
      return pool && !pool.disabled && !status?.hasValidKey;
    });
  };

  const getSelectedPoolsWithValidKeys = () => {
    return Array.from(state.selectedPoolAddresses).filter(poolAddress => {
      const status = state.viewingKeyStatuses[poolAddress];
      return status?.hasValidKey;
    });
  };

  const getSelectedDisabledPools = () => {
    return Array.from(state.selectedPoolAddresses).filter(poolAddress => {
      const pool = state.rewardPools.find(p => p.pool_address === poolAddress);
      return pool?.disabled;
    });
  };

  const poolsNeedingKeys = getSelectedPoolsNeedingKeys();
  const poolsWithValidKeys = getSelectedPoolsWithValidKeys();
  const disabledPools = getSelectedDisabledPools();
  const canSetKeys = poolsNeedingKeys.length > 0 && state.permitSignature;
  const canWithdraw = poolsNeedingKeys.length === 0 && (poolsWithValidKeys.length > 0 || disabledPools.length > 0);

  // Show loading state while viewing keys are loading
  if (!state.viewingKeysLoaded) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <Card>
          <CardBody>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '3rem 1rem'
            }}>
              <div className="loading-spinner-large" />
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Loading viewing keys for your wallet...
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Reward Pool Migration</h2>
            <Button
              variant="ghost"
              size="small"
              onClick={handleSelectAll}
              disabled={state.isLoading}
            >
              Select All
            </Button>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
            Select pools to withdraw from. Viewing keys will be set automatically where needed.
          </p>
        </CardHeader>

        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {state.rewardPools.map(pool => (
              <PoolRow
                key={pool.pool_address}
                pool={pool}
                balance={state.poolBalances[pool.pool_address]}
                viewingKeyStatus={state.viewingKeyStatuses[pool.pool_address]}
                isSelected={state.selectedPoolAddresses.has(pool.pool_address)}
                onToggleSelection={handleTogglePoolSelection}
                disabled={state.isLoading || isSettingKeys || isWithdrawing}
              />
            ))}
          </div>
        </CardBody>

        <CardFooter>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                Withdraw from Pools ({poolsWithValidKeys.length + disabledPools.length})
              </Button>
            )}

            <div style={{ 
              marginLeft: 'auto', 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)' 
            }}>
              {state.selectedPoolAddresses.size} of {state.rewardPools.length} pools selected
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// TODO: Move to separate component file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WithdrawSummary: React.FC<{ results: WithdrawResult[] }> = ({ results }) => {
  const { dispatch } = useAppContext();

  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0 }}>Withdrawal Complete</h3>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((result, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: 'var(--color-surface-elevated)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <span>{result.symbol}</span>
              <span>{result.amount} {result.symbol}</span>
            </div>
          ))}
        </div>
      </CardBody>
      <CardFooter>
        <Button onClick={() => dispatch({ type: 'HIDE_MODAL' })}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}; 