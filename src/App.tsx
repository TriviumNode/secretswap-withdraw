import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Header } from './components/common/Header';
import { Modal } from './components/common/Modal';
import { InfoPage } from './components/info/InfoPage';
import { RewardPoolsList } from './components/rewards/RewardPoolsList';
import { LiquidityPoolsList } from './components/liquidity/LiquidityPoolsList';
import './styles/themes.css';
import './styles/components.css';
import './App.css';

const AppContent: React.FC = () => {
  const { state } = useAppContext();

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'info':
        return <InfoPage />;
      case 'reward-pools':
        return <RewardPoolsList />;
      case 'liquidity-pools':
        return <LiquidityPoolsList />;
      case 'complete':
        return (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: 'var(--color-text-primary)'
          }}>
            <h2>Migration Complete!</h2>
            <p>All funds have been successfully withdrawn.</p>
          </div>
        );
      default:
        return <InfoPage />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-background)',
      color: 'var(--color-text-primary)',
    }}>
      <Header />
      <main>
        {renderCurrentStep()}
      </main>
      
      {/* Loading overlay */}
      {state.isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            padding: '2rem',
            borderRadius: 'var(--border-radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div className="loading-spinner-large" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Global error display */}
      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1001,
        }}>
          <div className="alert alert-error" style={{ margin: 0 }}>
            {state.error}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
