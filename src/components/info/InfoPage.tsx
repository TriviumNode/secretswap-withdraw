import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useKeplr } from '../../hooks/useKeplr';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { DeveloperSupport } from './DeveloperSupport';
import '../../styles/components.css';
import { TestingPanel } from '../testing/TestingPanel';

export const InfoPage: React.FC = () => {
  const { dispatch } = useAppContext();
  const { connectWallet, signPermitMessage, isConnecting, error, clearError } = useKeplr();

  const handleStartMigration = async () => {
    clearError();
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Connect wallet and check balance
      const { walletAddress, scrtBalance } = await connectWallet();
      
      dispatch({ 
        type: 'SET_WALLET_CONNECTION', 
        payload: { address: walletAddress, balance: scrtBalance }
      });

      // Sign permit to use as deterministic viewing key
      try {
        const permitSignature = await signPermitMessage(walletAddress);
        dispatch({ type: 'SET_PERMIT_SIGNATURE', payload: permitSignature });
      } catch (permitError) {
        console.warn('Failed to sign permit, will set viewing keys manually:', permitError);
      }

      // Move to reward pools step - viewing keys will load automatically
      dispatch({ type: 'SET_STEP', payload: 'reward-pools' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start migration';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '3rem',
          fontWeight: '700',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          Secret Swap Migration
        </h1>
        <p style={{ 
          fontSize: '1.25rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Withdraw your funds from Secret Swap reward pools and liquidity pools before the protocol shutdown.
        </p>
      </div>

      {/* Migration Steps */}
      <Card>
        <CardHeader>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Migration Process
          </h2>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                color: 'var(--color-text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                  Connect Wallet & Sign Permit
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  Connect your Keplr wallet and sign a permit message use as a viewing key.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                color: 'var(--color-text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                  Withdraw from Reward Pools
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  Set viewing keys for pools that need them, then withdraw your staked tokens and earned rewards.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-border)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)' }}>
                  Withdraw from Liquidity Pools (Coming Soon)
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  Withdraw your underlying assets from AMM liquidity pools.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Before You Start
          </h2>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Install and unlock the Keplr wallet extension
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                !
              </div>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Have at least <strong>1 SCRT</strong> in your wallet for transaction fees
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                i
              </div>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                The permit signature will be saved locally for future visits
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Start Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Button
          variant="primary"
          size="large"
          onClick={handleStartMigration}
          loading={isConnecting}
          style={{ minWidth: '200px' }}
        >
          {isConnecting ? 'Connecting...' : 'Start Migration'}
        </Button>
      </div>

      {/* Developer Support Section */}
      <DeveloperSupport />

      {/* Testing Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <TestingPanel />
      )}
    </div>
  );
}; 