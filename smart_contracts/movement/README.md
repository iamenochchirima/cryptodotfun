# Movement NFT Collection Contract

This directory contains the Movement blockchain smart contract for NFT collection creation and management using the Aptos Digital Asset standard.

## Prerequisites

- Movement CLI installed
- Movement wallet with testnet tokens

## Contract Overview

The `nft_collection` module provides:
- **Collection Creation**: Create NFT collections with optional max supply and royalties
- **Token Minting**: Mint individual NFTs to recipients
- **Batch Minting**: Mint multiple NFTs in a single transaction
- **Metadata Management**: Update collection description and URI
- **View Functions**: Query collection and token addresses

## Building the Contract

### 1. Compile the Contract

```bash
cd smart_contracts/movement
movement move compile
```

This will:
- Check for syntax errors
- Verify dependencies
- Generate compiled bytecode

### 2. Run Tests (if any)

```bash
movement move test
```

## Deploying the Contract

### Initial Deployment

```bash
# Deploy with named address replacement
movement move publish --named-addresses nft_launchpad=default
```

This will:
1. Prompt you to confirm the deployment
2. Deploy the module to your account address
3. Output the transaction hash and module address

**IMPORTANT**: After deployment, copy the module address (your account address) and update:
```
client/lib/movement/collection.ts
```

Replace `MODULE_ADDRESS` with your deployed address:
```typescript
const MODULE_ADDRESS = "0xYOUR_DEPLOYED_ADDRESS_HERE"
```

### Deployment to Specific Account

If you want to deploy to a specific account:

```bash
movement move publish --named-addresses nft_launchpad=0xYOUR_ACCOUNT_ADDRESS
```

## Destructive Operations (Reset & Redeploy)

### When to Use This

Use this when you need to:
- Deploy a completely new version with breaking changes
- Reset your local development state
- Fix deployment issues by starting fresh

### Step 1: Clear Local Movement Data

```bash
# Remove the .movement directory (contains local blockchain state)
rm -rf .movement

# Alternative: Just remove build artifacts
rm -rf build/
```

### Step 2: Reinitialize Movement

```bash
# Initialize a new Movement project (if needed)
movement init --name nft_launchpad

# Or just create a new account
movement account create
```

### Step 3: Fund Your New Account

Get testnet tokens from the faucet:

```bash
# Option 1: Via CLI
movement account fund-with-faucet --account default

# Option 2: Via web faucet
# Visit: https://faucet.movementlabs.xyz/
# Enter your account address (get it with: movement account list)
```

### Step 4: Deploy Fresh Contract

```bash
# Clean build
movement move clean
movement move compile

# Deploy
movement move publish --named-addresses nft_launchpad=default
```

### Step 5: Update Frontend Configuration

After deployment, update the module address in:
```
client/lib/movement/collection.ts
```

## Interacting with the Deployed Contract

### Create a Collection

```bash
movement move run \
  --function-id 'YOUR_ADDRESS::nft_collection::create_collection' \
  --args \
    string:"My NFT Collection" \
    string:"An amazing collection" \
    string:"https://example.com/collection.json" \
    'vector<u64>:1000' \
    u64:5 \
    u64:100
```

Parameters:
- `name`: Collection name
- `description`: Collection description
- `uri`: Metadata URI
- `max_supply`: Optional max supply (empty vector `vector<u64>:` for unlimited, or `vector<u64>:1000` for 1000)
- `royalty_numerator`: Royalty numerator (5)
- `royalty_denominator`: Royalty denominator (100) → 5/100 = 5%

### Mint a Token

```bash
movement move run \
  --function-id 'YOUR_ADDRESS::nft_collection::mint_token' \
  --args \
    string:"My NFT Collection" \
    string:"NFT #1 description" \
    string:"NFT #1" \
    string:"https://example.com/nft1.json" \
    address:RECIPIENT_ADDRESS
```

### View Collection Address

```bash
movement move view \
  --function-id 'YOUR_ADDRESS::nft_collection::get_collection_address' \
  --args \
    address:CREATOR_ADDRESS \
    string:"My NFT Collection"
```

### Check if Collection Exists

```bash
movement move view \
  --function-id 'YOUR_ADDRESS::nft_collection::collection_exists' \
  --args \
    address:CREATOR_ADDRESS \
    string:"My NFT Collection"
```

## Contract Upgrade Policy

Movement contracts use the **compatible upgrade policy** by default:
- ✅ Can add new functions
- ✅ Can add new structs
- ✅ Can modify function implementations
- ❌ Cannot remove or change existing public function signatures
- ❌ Cannot remove or modify existing struct fields

To upgrade:

```bash
movement move publish --named-addresses nft_launchpad=default --upgrade
```

## Network Configuration

### Testnet (Porto)
- RPC: `https://aptos.testnet.porto.movementlabs.xyz/v1`
- Faucet: `https://faucet.movementlabs.xyz/`

### Mainnet
- RPC: `https://fullnode.mainnet.movementnetwork.xyz/v1`

## Troubleshooting

### "Module already exists" Error

If you get this error during deployment:
```
movement move publish --named-addresses nft_launchpad=default --upgrade
```

### "Out of Gas" Error

Increase gas limit:
```
movement move publish --named-addresses nft_launchpad=default --gas-budget 100000
```

### Compilation Errors

1. Clear build cache:
```bash
movement move clean
```

2. Verify dependencies in `Move.toml`:
```toml
[dependencies.AptosFramework]
git = "https://github.com/movementlabsxyz/aptos-core.git"
rev = "movement"
subdir = "aptos-move/framework/aptos-framework"

[dependencies.AptosTokenObjects]
git = "https://github.com/movementlabsxyz/aptos-core.git"
rev = "movement"
subdir = "aptos-move/framework/aptos-token-objects"
```

3. Recompile:
```bash
movement move compile
```

### Account Issues

List accounts:
```bash
movement account list
```

Create new account:
```bash
movement account create --account <name>
```

Switch default account:
```bash
movement init --network testnet
```

## Security Considerations

1. **Royalty Validation**: The contract validates royalty percentage (max 10%)
2. **Collection Ownership**: Only the creator can mint tokens and update metadata
3. **Named Tokens**: Uses deterministic token addresses for consistency
4. **Transfer Control**: Tokens are transferable by default (soulbound transfer disabled in code)

## Module Structure

```
nft_collection.move
├── Structs
│   ├── CollectionData (stores mutator_ref)
│   └── MintingCapability (stores extend_ref)
├── Entry Functions
│   ├── create_collection()
│   ├── mint_token()
│   ├── batch_mint_tokens()
│   ├── update_collection_description()
│   └── update_collection_uri()
└── View Functions
    ├── collection_exists()
    ├── get_collection_address()
    └── get_token_address()
```

## Resources

- [Movement Documentation](https://docs.movementlabs.xyz/)
- [Aptos Move Documentation](https://aptos.dev/move/move-on-aptos/)
- [Aptos Token Objects](https://aptos.dev/standards/digital-asset/)
- [Movement Discord](https://discord.gg/movementlabsxyz)
