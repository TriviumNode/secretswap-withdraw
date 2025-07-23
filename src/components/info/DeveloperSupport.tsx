import React from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';

export const DeveloperSupport: React.FC = () => {
  const explorers = [
    {
      name: 'Secret Nodes',
      url: 'https://secretnodes.com/validator/secretvaloper1a73czfcgtzx6y2xn6l7yj9wplrmhqp7fezv7f8',
      description: 'Primary Secret Network explorer'
    },
    {
      name: 'BigDipper',
      url: 'https://bigdipper.live/secret/validators/secretvaloper1a73czfcgtzx6y2xn6l7yj9wplrmhqp7fezv7f8',
      description: 'Detailed validator information'
    },
    {
      name: 'Mintscan',
      url: 'https://www.mintscan.io/secret/validators/secretvaloper1a73czfcgtzx6y2xn6l7yj9wplrmhqp7fezv7f8',
      description: 'Popular Cosmos ecosystem explorer'
    }
  ];

  return (
    <Card style={{ marginTop: '3rem' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/trivium_logo_black.svg" 
            alt="Trivium" 
            style={{ height: '32px' }}
            onError={(e) => {
              // Fallback for missing logo
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            Support the Developers
          </h2>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6'
          }}>
            This migration tool was built by the Trivium team. If you found it helpful, 
            consider supporting our work by delegating your SCRT to our validator.
          </p>
          
          <div style={{ 
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
              secretvaloper1a73czfcgtzx6y2xn6l7yj9wplrmhqp7fezv7f8
            </code>
          </div>

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
            <strong>Note:</strong> Delegating helps secure the Secret Network and supports 
            continued development of tools like this migration assistant.
          </div>
        </div>
      </CardBody>
    </Card>
  );
}; 