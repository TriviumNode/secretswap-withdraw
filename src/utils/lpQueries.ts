/**
 * Query classes for LP (Liquidity Pool) pair contracts
 */

/**
 * Query to get pair information from an LP contract
 * Returns PairInfo
 */
export class PairQuery {
  pair: Record<string, never>;

  constructor() {
    this.pair = {};
  }
}

/**
 * Query to get pool state (assets and total share) from an LP contract
 * Returns PoolResponse
 */
export class PoolQuery {
  pool: Record<string, never>;

  constructor() {
    this.pool = {};
  }
}
