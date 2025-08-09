# CryptoDotFun Express Server

A robust Express.js API server for the CryptoDotFun multi-chain crypto platform.

## Features

- ✅ **Multi-chain Support**: Ethereum, Solana, Bitcoin, Internet Computer
- ✅ **Internet Computer Integration**: Direct canister interaction
- ✅ **Security**: Helmet, CORS, input validation
- ✅ **Development**: Hot reload with ts-node
- ✅ **TypeScript**: Full type safety
- ✅ **Modular Architecture**: Clean separation of concerns

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm or npm

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/status` - API status
- `GET /api/ic/status` - Internet Computer network status

### Blockchain Integration
- `GET /api/blockchain/networks` - Supported blockchain networks
- `POST /api/wallets/verify` - Wallet signature verification
- `GET /api/ic/canister/:canisterId` - IC canister interaction

### NFTs & Digital Assets
- `GET /api/nfts/collections` - NFT collections (multi-chain)
- `GET /api/nfts/:collectionId` - Specific collection details

### Bitcoin Assets
- `GET /api/bitcoin/ordinals` - Bitcoin Ordinals marketplace
- `GET /api/bitcoin/runes` - Bitcoin Runes trading
- `POST /api/bitcoin/etch-rune` - Create new Bitcoin Runes

### Token Trading
- `GET /api/tokens/prices` - Real-time token prices
- `GET /api/tokens/portfolio/:address` - Portfolio tracking
- `POST /api/trading/create-bot` - Create trading bots

### Platform Features
- `GET /api/learn/courses` - Learning platform courses
- `GET /api/gaming/leaderboard` - Gaming leaderboards

## Configuration

Environment variables in `.env`:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Architecture

```
├── index.ts              # Main Express server
├── src/
│   ├── utils.ts          # IC utilities
│   ├── constants.ts      # Network configuration
│   └── demo.ts          # Demo/testing utilities
├── package.json
├── tsconfig.json
└── .env
```

## Features Implementation Status

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ Core API | Complete | Basic Express server with security |
| ✅ IC Integration | Complete | Internet Computer canister interaction |
| 🚧 NFT Marketplace | Scaffold | Multi-chain NFT endpoints ready |
| 🚧 Bitcoin Assets | Scaffold | Ordinals/Runes endpoints ready |
| 🚧 Token Trading | Scaffold | Trading & bot endpoints ready |
| 🚧 Wallet Verification | Scaffold | Multi-chain signature verification |
| 📋 Database Layer | Planned | PostgreSQL/MongoDB integration |
| 📋 WebSocket Support | Planned | Real-time data streaming |

## Development

### Adding New Endpoints
1. Add route handler in `index.ts`
2. Implement business logic in `src/` files
3. Add proper error handling
4. Update this README

### Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test API status
curl http://localhost:3001/api/status

# Test IC status
curl http://localhost:3001/api/ic/status
```

## Deployment

### Docker (coming soon)
```bash
docker build -t cryptodotfun-server .
docker run -p 3001:3001 cryptodotfun-server
```

### Production
- Use PM2 or similar process manager
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Add rate limiting and monitoring

## Contributing

1. Follow TypeScript strict mode
2. Add proper error handling
3. Update API documentation
4. Test all endpoints

---

Built with ❤️ for the CryptoDotFun ecosystem
