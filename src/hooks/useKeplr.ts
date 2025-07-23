import { useState, useCallback } from 'react';
import { SecretNetworkClient } from 'secretjs';

export const useKeplr = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.keplr) {
        throw new Error('Keplr extension not found. Please install Keplr and try again.');
      }

      // Enable the chain
      await window.keplr.enable('secret-4');

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner('secret-4');
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        throw new Error('No accounts found in Keplr wallet');
      }

      const walletAddress = accounts[0].address;

      // Create client and check SCRT balance
      const client = new SecretNetworkClient({
        chainId: 'secret-4',
        url: 'https://secret.api.trivium.network:1317',
        wallet: offlineSigner,
        walletAddress,
        encryptionUtils: window.keplr.getEnigmaUtils('secret-4'),
      });

      const balanceResponse = await client.query.bank.balance({
        address: walletAddress,
        denom: 'uscrt',
      });

      const scrtBalance = balanceResponse.balance?.amount || '0';
      const scrtInWallet = parseInt(scrtBalance) / 1_000_000;

      return {
        client,
        walletAddress,
        scrtBalance: scrtInWallet.toString(),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const signPermitMessage = useCallback(async (walletAddress: string): Promise<string> => {
    try {
      if (!window.keplr) {
        throw new Error('Keplr not available');
      }

      const cacheKey = `SecretSwap-Migration-Permit-${walletAddress}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;

      // Create a permit message for all reward pools
      const permitMsg = {
        chain_id: 'secret-4',
        account_number: '0',
        sequence: '0',
        fee: { amount: [], gas: '1' },
        msgs: [{
          type: 'query_permit',
          value: {
            permit_name: 'SecretSwap Migration',
            allowed_tokens: ['*'], // Allow all tokens
            permissions: ['balance', 'allowance'],
          }
        }],
        memo: 'SecretSwap Migration Permit - Generated deterministically for viewing key creation',
      };

      const signature = await window.keplr.signAmino('secret-4', walletAddress, permitMsg);
      localStorage.setItem(cacheKey, signature.signature.signature)
      
      // Return the signature string that can be used as a viewing key
      return signature.signature.signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign permit';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connectWallet,
    signPermitMessage,
    isConnecting,
    error,
    clearError,
  };
}; 