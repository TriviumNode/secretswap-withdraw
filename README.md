# Secret Swap Migration Tool

Warning: AI slop ahead.

A React application for migrating funds from the defunct Secret Swap protocol on Secret Network. This tool allows users to safely withdraw from reward pools and liquidity pools.

![Secret Swap Migration Tool](https://via.placeholder.com/800x400/f4c430/000000?text=Secret+Swap+Migration+Tool)

## ✨ Features

- **🔐 Secure Wallet Integration** - Connect with Keplr wallet
- **📝 Permit-Based Authentication** - Deterministic viewing key generation
- **🏊 Reward Pool Migration** - Batch withdrawal from staking pools
- **💰 Liquidity Pool Support** - LP token burning and asset claiming (Coming Soon)
- **🌙 Dark/Light Theme** - Professional UI matching Secret Swap branding
- **📱 Mobile Responsive** - Works on desktop and mobile devices
- **💾 Local Storage** - Persistent permit signatures and viewing keys
- **🔄 Batch Transactions** - Efficient multi-pool operations

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Yarn** package manager
- **Keplr Wallet** browser extension
- **At least 1 SCRT** in your wallet for transaction fees

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/secretswap-withdraw.git
cd secretswap-withdraw

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

## 🧪 Testing the Migration Flow

### 1. Development Setup

```bash
# Start the dev server with hot reload
yarn dev

# Open http://localhost:5173 in your browser
```

### 2. Wallet Connection Testing

1. **Install Keplr** if not already installed
2. **Add Secret Network** to Keplr (should be automatic)
3. **Fund your wallet** with at least 1 SCRT for fees
4. Click **"Start Migration"** on the landing page

### 3. Permit Signature Testing

The app will attempt to sign a permit message for pools with permit support:

```typescript
// Example permit message structure
{
  chain_id: 'secret-4',
  account_number: '0',
  sequence: '0',
  fee: { amount: [], gas: '1' },
  msgs: [{
    type: 'query_permit',
    value: {
      permit_name: 'SecretSwap Migration',
      allowed_tokens: ['*'],
      permissions: ['balance', 'allowance'],
    }
  }],
  memo: 'SecretSwap Migration Permit - Generated deterministically for viewing key creation',
}
```

### 4. Viewing Key Management Testing

The app follows this priority for viewing keys:

1. **Existing Keplr keys** - Query from wallet extension
2. **Migration-generated keys** - Set using permit signature as deterministic key
3. **Manual key setting** - Batch transaction to set keys for selected pools

### 5. Pool Balance Queries

Test balance queries for different pool types:

- **Permit pools** - Should show balances immediately
- **Pools with Keplr keys** - Should show balances after key detection
- **Pools without keys** - Should show "Balance hidden" until keys are set

### 6. Withdrawal Testing

**IMPORTANT**: Test on Secret Network testnet first!

1. **Select pools** with actual balances
2. **Set viewing keys** if needed (batch transaction)
3. **Execute withdrawals** (batch transaction with multiple redeem messages)
4. **Verify results** in the success modal

## 🔧 Development

### Project Structure

```
src/
├── components/           # React components
│   ├── common/          # Reusable UI components
│   ├── info/            # Landing page components
│   ├── rewards/         # Reward pool components
│   ├── liquidity/       # Liquidity pool components (Coming Soon)
│   └── testing/         # Development testing tools
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── styles/              # CSS theme and component styles
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Static JSON data files
```

### Key Components

- **`AppContext`** - Global state management with useReducer
- **`useKeplr`** - Wallet connection and permit signing
- **`useLocalStorage`** - Persistent data management
- **`RewardPoolsList`** - Main migration interface
- **`PoolRow`** - Individual pool display and interaction

### Environment Variables

```bash
# Optional: Customize RPC endpoint
VITE_SECRET_RPC_URL=https://secret.api.trivium.network:1317

# Development: Enable testing panel
NODE_ENV=development
```

## 🎨 Theme Customization

The app uses CSS custom properties for theming:

```css
/* Light theme (default) */
:root {
  --color-primary: #f4c430;
  --color-background: #faf9f6;
  --color-text-primary: #2d1810;
  /* ... */
}

/* Dark theme */
[data-theme="dark"] {
  --color-primary: #f4c430;
  --color-background: #0f0f0f;
  --color-text-primary: #ffffff;
  /* ... */
}
```

## 🔒 Security Considerations

- **Local Storage** - Permit signatures are stored locally (not on servers)
- **Viewing Keys** - Generated deterministically from permit signatures
- **No Private Keys** - All signing happens through Keplr extension
- **Transaction Verification** - Users approve all transactions in Keplr
- **Error Handling** - Comprehensive error boundaries and user feedback

## 🚧 Current Status

### ✅ Completed Features

- [x] Wallet connection and permit signing
- [x] Viewing key detection and management
- [x] Reward pool selection interface
- [x] Batch viewing key setting
- [x] Batch withdrawal transactions
- [x] Theme system and responsive design
- [x] Error handling and loading states
- [x] Local storage persistence
- [x] Developer support section

### 🔄 In Progress

- [ ] Complete testing with live Keplr integration
- [ ] Performance optimizations
- [ ] Additional error recovery mechanisms

### 📋 Planned Features

- [ ] Liquidity pool migration functionality
- [ ] Transaction history tracking
- [ ] Advanced slippage protection
- [ ] Multi-wallet support
- [ ] Analytics and reporting

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **CSS Custom Properties** for theming
- **React Hooks** for state management

### Testing

```bash
# Run type checking
yarn type-check

# Run linting
yarn lint

# Run tests (when implemented)
yarn test

# Build and verify
yarn build
```

## 📞 Support

### For Users

- **Trivium Validator**: Support the developers by delegating to `secretvaloper1a73czfcgtzx6y2xn6l7yj9wplrmhqp7fezv7f8`
- **Community**: Join the Secret Network Discord for general support
- **Issues**: Report bugs on GitHub Issues

### For Developers

- **Documentation**: See code comments and TypeScript definitions
- **Architecture**: Review the `src/contexts/AppContext.tsx` for state management
- **API Integration**: Check `src/utils/` for Secret Network queries

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Secret Network** community for protocol support
- **Keplr Team** for wallet integration capabilities
- **Secret Swap** for the original DeFi protocols
- **Trivium** team for development and maintenance

---

**⚠️ Disclaimer**: This tool is provided as-is for migration purposes. Always verify transactions before signing. The developers are not responsible for any loss of funds due to user error or unforeseen technical issues.
