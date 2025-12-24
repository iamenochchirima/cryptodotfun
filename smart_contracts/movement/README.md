# Movement Smart Contracts

NFT Launchpad and Marketplace smart contracts for Movement Network.

## Project Structure

```
movement/
├── launchpad/          # NFT collection creation & minting (nft_launchpad::launchpad)
└── marketplace/        # NFT marketplace with escrow (marketplace_addr::marketplace)
```

## Prerequisites

1. Install Movement CLI:
```bash
curl -fsSL https://get.movementlabs.xyz/cli | sh
```

2. Initialize Movement (first time only):
```bash
movement init
```

3. Fund your account from faucet:
```bash
movement account fund-with-faucet --account default
# Or visit: https://faucet.movementlabs.xyz/
```

## Deploy Launchpad

```bash
cd launchpad

# Compile
movement move compile

# Publish to testnet
movement move publish --named-addresses nft_launchpad=default --assume-yes
```

## Deploy Marketplace

```bash
cd marketplace

# Compile
movement move compile

# Publish to testnet
movement move publish --named-addresses marketplace_addr=default --assume-yes
```

## Network Info

- **Testnet RPC:** `https://testnet.movementnetwork.xyz/v1`
- **Faucet:** `https://faucet.movementlabs.xyz/`
- **Explorer:** `https://explorer.movementnetwork.xyz/?network=testnet`
