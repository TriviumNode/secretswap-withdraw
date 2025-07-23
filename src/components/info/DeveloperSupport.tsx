import React from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';

export const DeveloperSupport: React.FC = () => {
  const explorers = [
    {
      name: 'Mintscan',
      url: 'https://www.mintscan.io/secret/validators/secretvaloper1ahawe276d250zpxt0xgpfg63ymmu63a0svuvgw',
      description: 'Primary Cosmos ecosystem explorer'
    },
    {
      name: 'Ping.pub',
      url: 'https://ping.pub/secret/staking/secretvaloper1ahawe276d250zpxt0xgpfg63ymmu63a0svuvgw',
      description: 'Lightweight explorer for Cosmos-based blockchains'
    },
  ];

  return (
    <Card style={{ marginTop: '3rem' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Support the Developers
          </h2>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <img 
            src="/trivium_logo_blue.svg" 
            alt="Trivium" 
            style={{ height: '32px' }}
            onError={(e) => {
              // Fallback for missing logo
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <p style={{ 
            margin: 0, 
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            This migration tool was built by Trivium.<br/>If you found it helpful, 
            consider supporting our work by delegating to our validator.
          </p>
          
          {/* <div style={{ 
            background: 'var(--color-surface-elevated)',
            padding: '1rem',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ 
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem'
            }}>
              Validator Address:
            </div>
            <code style={{ 
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              background: 'var(--color-surface)',
              padding: '0.5rem',
              borderRadius: 'var(--border-radius-sm)',
              display: 'block',
              wordBreak: 'break-all',
              border: '1px solid var(--color-border)'
            }}>
              secretvaloper1ahawe276d250zpxt0xgpfg63ymmu63a0svuvgw
            </code>
          </div> */}

          <div>
            <h4 style={{ 
              margin: '0 0 1rem 0',
              color: 'var(--color-text-primary)',
              fontSize: '1rem'
            }}>
              Delegate on these explorers:
            </h4>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {explorers.map((explorer, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => window.open(explorer.url, '_blank', 'noopener,noreferrer')}
                  style={{ 
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    height: 'auto',
                    padding: '1rem',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{explorer.name}</span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--color-text-muted)',
                    fontWeight: '400'
                  }}>
                    {explorer.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div style={{ 
            padding: '1rem',
            background: 'rgba(244, 196, 48, 0.1)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            <strong>Note:</strong> Delegating helps secure Secret Network and supports 
            continued development of tools like this.
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 