import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useKeplr } from '../../hooks/useKeplr';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';

// Utility function for getting permit (keeping existing localStorage logic)
const getPermit = (walletAddress: string): string | null => {
  const cacheKey = `SecretSwap-Migration-Permit-${walletAddress}`;
  try {
    return localStorage.getItem(cacheKey);
  } catch (error) {
    console.error('Failed to get permit from localStorage:', error);
    return null;
  }
};

export const TestingPanel: React.FC = () => {
  const { state, dispatch, getViewingKeys } = useAppContext();
  const { connectWallet, signPermitMessage } = useKeplr();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runWalletTest = async () => {
    try {
      addTestResult('Testing wallet connection...');
      const result = await connectWallet();
      addTestResult(`✅ Wallet connected: ${result.walletAddress}`);
      addTestResult(`✅ SCRT balance: ${result.scrtBalance}`);
    } catch (error) {
      addTestResult(`❌ Wallet test failed: ${error}`);
    }
  };

  const runPermitTest = async () => {
    if (!state.walletAddress) {
      addTestResult('❌ No wallet connected');
      return;
    }

    try {
      addTestResult('Testing permit signature...');
      const signature = await signPermitMessage(state.walletAddress);
      addTestResult(`✅ Permit signed successfully`);
      addTestResult(`📝 Signature length: ${signature.length} chars`);
      
      // Test if it's valid JSON
      try {
        JSON.parse(signature);
        addTestResult('✅ Signature is valid JSON');
      } catch {
        addTestResult('⚠️ Signature is not valid JSON');
      }
    } catch (error) {
      addTestResult(`❌ Permit test failed: ${error}`);
    }
  };

  const checkStoredData = () => {
    if (!state.walletAddress) {
      addTestResult('❌ No wallet connected');
      return;
    }

    addTestResult('Checking stored data...');
    
    const permit = getPermit(state.walletAddress);
    if (permit) {
      addTestResult(`✅ Permit found in storage (${permit.length} chars)`);
    } else {
      addTestResult('ℹ️ No permit in storage');
    }

    const viewingKeys = getViewingKeys(state.walletAddress);
    addTestResult(`ℹ️ Viewing keys set for ${viewingKeys.length} pools`);
    
    if (viewingKeys.length > 0) {
      addTestResult(`📝 Pool addresses: ${viewingKeys.slice(0, 3).join(', ')}${viewingKeys.length > 3 ? '...' : ''}`);
    }
  };

  const testPoolData = () => {
    addTestResult('Testing pool data...');
    addTestResult(`📊 Total reward pools: ${state.rewardPools.length}`);
    
    const disabledPools = state.rewardPools.filter(p => p.disabled);
    addTestResult(`⚠️ Disabled pools: ${disabledPools.length}`);
  };

  const clearAllData = () => {
    addTestResult('Clearing all stored data...');
    dispatch({ type: 'CLEAR_STORAGE_DATA' });
    addTestResult('✅ All data cleared');
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardHeader>
        <h3 style={{ margin: 0 }}>🧪 Development Testing Panel</h3>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
          Use these tools to test wallet integration and debug issues
        </p>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Test Actions */}
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>Test Actions</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.5rem' 
            }}>
              <Button variant="secondary" size="small" onClick={runWalletTest}>
                Test Wallet
              </Button>
              <Button variant="secondary" size="small" onClick={runPermitTest}>
                Test Permit
              </Button>
              <Button variant="secondary" size="small" onClick={checkStoredData}>
                Check Storage
              </Button>
              <Button variant="secondary" size="small" onClick={testPoolData}>
                Test Pool Data
              </Button>
              <Button variant="ghost" size="small" onClick={clearAllData}>
                Clear All Data
              </Button>
              <Button variant="ghost" size="small" onClick={clearTestResults}>
                Clear Results
              </Button>
            </div>
          </div>

          {/* Current State */}
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>Current State</h4>
            <div style={{ 
              background: 'var(--color-surface-elevated)',
              padding: '1rem',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              <div>Connected: {state.isWalletConnected ? '✅' : '❌'}</div>
              <div>Wallet: {state.walletAddress || 'None'}</div>
              <div>SCRT Balance: {state.scrtBalance}</div>
              <div>Theme: {state.theme}</div>
              <div>Step: {state.currentStep}</div>
              <div>Has Permit: {state.permitSignature ? '✅' : '❌'}</div>
              <div>Selected Pools: {state.selectedPoolAddresses.size}</div>
              <div>Pool Balances: {Object.keys(state.poolBalances).length}</div>
              <div>Viewing Key Statuses: {Object.keys(state.viewingKeyStatuses).length}</div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0' }}>Test Results</h4>
              <div style={{ 
                background: 'var(--color-surface-elevated)',
                padding: '1rem',
                borderRadius: 'var(--border-radius-md)',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                border: '1px solid var(--color-border)'
              }}>
                {testResults.map((result, index) => (
                  <div key={index} style={{ marginBottom: '0.25rem' }}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}; 