import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';

export const LiquidityPoolsList: React.FC = () => {
  const { dispatch } = useAppContext();

  const handleBackToRewards = () => {
    dispatch({ type: 'SET_STEP', payload: 'reward-pools' });
  };

  const handleComplete = () => {
    dispatch({ type: 'SET_STEP', payload: 'complete' });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <Card>
        <CardHeader>
          <h2 style={{ margin: 0 }}>Liquidity Pool Migration</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
            Withdraw your LP tokens and underlying assets from AMM liquidity pools.
          </p>
        </CardHeader>

        <CardBody>
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'var(--color-surface-elevated)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px dashed var(--color-border)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>
              Coming Soon
            </h3>
            <p style={{ 
              color: 'var(--color-text-secondary)', 
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
              lineHeight: '1.6'
            }}>
              Liquidity pool migration functionality is currently under development. 
              This will allow you to withdraw your LP tokens and receive the underlying 
              assets from Secret Swap's AMM pools.
            </p>

            <div style={{ 
              background: 'var(--color-surface)',
              padding: '1.5rem',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>
                Planned Features:
              </h4>
              <ul style={{ 
                margin: 0,
                paddingLeft: '1.5rem',
                color: 'var(--color-text-secondary)'
              }}>
                <li>Detect LP token balances in your wallet</li>
                <li>Query underlying asset ratios for each pool</li>
                <li>Calculate withdrawal amounts</li>
                <li>Batch LP token burning and asset withdrawal</li>
                <li>Support for all Secret Swap AMM pairs</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button
                variant="secondary"
                onClick={handleBackToRewards}
              >
                ← Back to Reward Pools
              </Button>
              
              <Button
                variant="primary"
                onClick={handleComplete}
              >
                Mark as Complete →
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TODO: Implementation Details */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <h3 style={{ margin: 0 }}>🛠️ Implementation Notes</h3>
        </CardHeader>
        <CardBody>
          <div style={{ 
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            fontFamily: 'monospace',
            background: 'var(--color-surface-elevated)',
            padding: '1rem',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div><strong>TODO Items for Liquidity Pool Migration:</strong></div>
            <br />
            <div>1. Create LiquidityPool interface and queries</div>
            <div>2. Implement LP token balance detection</div>
            <div>3. Query pool reserves and calculate withdrawal ratios</div>
            <div>4. Build LP withdrawal transaction messages</div>
            <div>5. Add pool selection UI similar to reward pools</div>
            <div>6. Implement batch LP burning and asset claiming</div>
            <div>7. Add slippage protection and minimum amounts</div>
            <div>8. Test with actual LP positions</div>
            <br />
            <div><strong>Data needed:</strong></div>
            <div>- LP token contract addresses and balances</div>
            <div>- Pool contract addresses and reserve ratios</div>
            <div>- Asset contract addresses for underlying tokens</div>
            <div>- Withdrawal fee calculations</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}; 