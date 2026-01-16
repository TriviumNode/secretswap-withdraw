/**
 * Query classes for SNIP20 token contracts
 */

/**
 * Query to get the balance of a SNIP20 token for a given address
 * Returns Snip20BalanceResponse
 */
export class Snip20BalanceQuery {
  balance: {
    address: string;
    key: string;
  };

  constructor(address: string, key: string) {
    this.balance = {
      address,
      key,
    };
  }
}
