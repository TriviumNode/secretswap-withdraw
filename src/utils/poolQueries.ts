import { batchQuery } from '@shadeprotocol/shadejs';
import type { RewardPool, PoolBalance, ViewingKeyStatus } from '../types';
import { getViewingKeyFromWallet } from './viewingKeys';
import { BridgeRewardsPoolBalanceQuery, SecretSwapRewardsPoolBalanceQuery } from './rewardQueries';
import { QueryRouterAddress, QueryRouterCodeHash } from '../constants';
import { queryContract } from './queryWrapper';

/**
 * Sorts reward pools according to the specified criteria:
 * 1. Secret Swap Staking pools first (reward_token.symbol !== 'sSCRT')
 * 2. Within those groups, disabled pools last
 * 3. Within those groups, pools with names first, then pools where deposit_token.symbol does NOT start with "LP"
 * 4. Lastly, alphabetical by deposit_token.symbol
 */
export const sortRewardPools = (pools: RewardPool[]): RewardPool[] => {
  return [...pools].sort((a, b) => {
    // Level 1: Pool type - Secret Swap Staking first
    const aIsSecretSwap = a.reward_token.symbol !== 'sSCRT';
    const bIsSecretSwap = b.reward_token.symbol !== 'sSCRT';
    
    if (aIsSecretSwap !== bIsSecretSwap) {
      return aIsSecretSwap ? -1 : 1; // Secret Swap first
    }
    
    // Level 2: Disabled status - enabled pools first
    if (a.disabled !== b.disabled) {
      return a.disabled ? 1 : -1; // enabled first
    }
    
    // Level 3: Pools with names first
    const aHasName = Boolean(a.name?.trim());
    const bHasName = Boolean(b.name?.trim());
    
    if (aHasName !== bHasName) {
      return aHasName ? -1 : 1; // pools with names first
    }
    
    // Level 4: Non-LP tokens first (only applies to pools without names)
    if (!aHasName && !bHasName) {
      const aIsLP = a.deposit_token.symbol.startsWith('LP');
      const bIsLP = b.deposit_token.symbol.startsWith('LP');
      
      if (aIsLP !== bIsLP) {
        return aIsLP ? 1 : -1; // non-LP first
      }
    }
    
    // Level 5: Alphabetical by deposit_token.symbol
    return a.deposit_token.symbol.localeCompare(b.deposit_token.symbol);
  });
};

export const detectViewingKeyStatuses = async (
  pools: RewardPool[],
  _walletAddress: string,
  _permitSignature: string | null,
  savedViewingKeys: string[]
): Promise<Record<string, ViewingKeyStatus>> => {
  const statuses: Record<string, ViewingKeyStatus> = {};

  for (const pool of pools) {
    const status: ViewingKeyStatus = {
      pool_address: pool.pool_address,
      hasValidKey: false,
      keySource: 'none',
    };

    // Try to get viewing key from Keplr wallet first
    try {
      const keplrKey = await getViewingKeyFromWallet(pool.pool_address);
      if (keplrKey) {
        // TODO: Test the key by querying balance
        status.hasValidKey = true;
        status.keySource = 'keplr';
        statuses[pool.pool_address] = status;
        continue;
      }
    } catch (error) {
      console.warn(`Failed to get Keplr viewing key for ${pool.pool_address}:`, error);
    }

    // Check if we have set a viewing key using our permit signature
    if (savedViewingKeys.includes(pool.pool_address)) {
      // TODO: Test the key by querying balance
      status.hasValidKey = true;
      status.keySource = 'signature';
    }

    statuses[pool.pool_address] = status;
  }

  return statuses;
};

export const batchQueryPoolBalances = async (
  pools: RewardPool[],
  viewingKeyStatuses: Record<string, ViewingKeyStatus>,
  walletAddress: string,
  permitSignature: string | null
): Promise<Record<string, PoolBalance>> => {
  const balances: Record<string, PoolBalance> = {};
  
  // Filter pools that have valid viewing keys and prepare queries
  const poolsWithKeys: Array<{
    pool: RewardPool;
    viewingKey: string;
    status: ViewingKeyStatus;
  }> = [];

  for (const pool of pools) {
    const status = viewingKeyStatuses[pool.pool_address];
    if (!status?.hasValidKey) continue;

    try {
      let viewingKey: string;
      
      if (status.keySource === 'signature' && permitSignature) {
        viewingKey = permitSignature;
      } else if (status.keySource === 'keplr') {
        const keplrKey = await getViewingKeyFromWallet(pool.pool_address);
        if (!keplrKey) continue;
        viewingKey = keplrKey;
      } else {
        continue;
      }

      poolsWithKeys.push({ pool, viewingKey, status });
    } catch (error) {
      console.error(`Failed to get viewing key for pool ${pool.pool_address}:`, error);
    }
  }

  if (poolsWithKeys.length === 0) {
    console.log('No pools with valid viewing keys found');
    return balances;
  }

  // Prepare batch queries
  const queries = poolsWithKeys.map((poolData) => {
    const query = poolData.pool.reward_token.address === 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek' ?
      new BridgeRewardsPoolBalanceQuery(walletAddress, poolData.viewingKey)
      : new SecretSwapRewardsPoolBalanceQuery(walletAddress, poolData.viewingKey);

    return {
      id: poolData.pool.pool_address, // Use pool address as ID for easy mapping
      contract: {
        address: poolData.pool.pool_address,
        codeHash: poolData.pool.code_hash,
      },
      queryMsg: query,
    };
  });

  try {
    console.log(`Batch querying balances for ${queries.length} pools...`);
    
    // Execute batch query using ShadeJS
    const batchResponse = await batchQuery({
      contractAddress: QueryRouterAddress,
      codeHash: QueryRouterCodeHash,
      lcdEndpoint: 'https://secret.api.trivium.network:1317',
      chainId: 'secret-4',
      queries,
      batchSize: 10,
    });

    // Process batch response
    for (const result of batchResponse) {
      try {
        const poolAddress = result.id as string;
        const pool = pools.find(p => p.pool_address === poolAddress);
        
        if (!pool) {
          console.warn(`Pool not found for address: ${poolAddress}`);
          continue;
        }

        if (result.status === 'error') {
          console.error(`Query failed for pool ${poolAddress}:`, result.response);
          continue;
        }

        if (result.response.query_error) {
          console.error(`Query failed for pool ${poolAddress}:`, result.response.query_error.msg);
          continue;
        }

        // Parse the balance from the response
        let balance = '0';
        if (result.response && typeof result.response === 'object') {
          // Handle different possible response formats
          if (result.response.balance) {
            balance = result.response.balance.amount;
          } else if (result.response.deposit) {
            balance = result.response.deposit.deposit;
          } else if (result.response.viewing_key_error) {
            console.warn(`Viewing key error for pool ${poolAddress}:`, result.response.viewing_key_error);
            continue;
          } else {
            console.warn(`Unexpected response format for pool ${poolAddress}:`, result.response);
          }
        }

        balances[poolAddress] = {
          pool_address: poolAddress,
          balance,
          symbol: pool.deposit_token.symbol,
          decimals: pool.deposit_token.decimals,
        };
        
        console.log(`✅ Pool ${pool.deposit_token.symbol}: ${balance}`);
      } catch (error) {
        console.error(`Failed to process result for pool:`, error, result);
      }
    }

    console.log(`Batch query completed. Retrieved ${Object.keys(balances).length} balances.`);
    
  } catch (error) {
    console.error('Batch query failed, falling back to individual queries:', error);
    
    // Fallback to individual queries if batch query fails
    for (const poolData of poolsWithKeys) {
      try {
        const response = await queryContract(
          poolData.pool.pool_address,
          new SecretSwapRewardsPoolBalanceQuery(walletAddress, poolData.viewingKey)
        )

        balances[poolData.pool.pool_address] = {
          pool_address: poolData.pool.pool_address,
          balance: response.balance.amount,
          symbol: poolData.pool.deposit_token.symbol,
          decimals: poolData.pool.deposit_token.decimals,
        };
      } catch (error) {
        console.error(`Failed to query balance for pool ${poolData.pool.pool_address}:`, error);
      }
    }
  }

  return balances;
};

export const formatTokenAmount = (
  amount: string,
  decimals: number,
  maxDecimals: number = 6
): string => {
  try {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    
    return num.toLocaleString('en-US', {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: 0,
    });
  } catch {
    return '0';
  }
};

export const hasValidBalance = (balance: string): boolean => {
  try {
    return parseFloat(balance) > 0;
  } catch {
    return false;
  }
}; 