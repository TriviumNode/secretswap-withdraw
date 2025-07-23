import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from './Button';
import '../../styles/components.css';

export const Header: React.FC = () => {
  const { state, dispatch } = useAppContext();

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const disconnectWallet = () => {
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img 
          src={state.theme === 'dark' ? '/secret-swap-light.png' : '/secret-swap-dark.png'} 
          alt="Secret Swap" 
          style={{ height: '40px' }}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('span');
              fallback.textContent = 'Secret Swap Migration';
              fallback.style.fontSize = '1.5rem';
              fallback.style.fontWeight = '600';
              fallback.style.color = 'var(--color-primary)';
              parent.appendChild(fallback);
            }
          }}
        />
        <span style={{ 
          fontSize: '0.875rem', 
          color: 'var(--color-text-secondary)',
          fontWeight: '500'
        }}>
          Migration Tool
        </span>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Wallet info */}
        {state.isWalletConnected && state.walletAddress && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {`${state.walletAddress.slice(0, 10)}...${state.walletAddress.slice(-6)}`}
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              {parseFloat(state.scrtBalance).toFixed(2)} SCRT
            </span>
          </div>
        )}

        {/* Disconnect button */}
        {state.isWalletConnected && (
          <Button 
            variant="ghost" 
            size="small"
            onClick={disconnectWallet}
          >
            Disconnect
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="small"
          onClick={toggleTheme}
          style={{ 
            width: '40px', 
            height: '40px', 
            padding: '0',
            fontSize: '1.25rem'
          }}
          title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {state.theme === 'light' ? '🌙' : '☀️'}
        </Button>
      </div>
    </header>
  );
}; 