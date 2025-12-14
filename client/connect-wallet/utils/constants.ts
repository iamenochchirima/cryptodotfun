// Solana network constants
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';

export const SOLANA_RPC_URLS = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
};

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  SOLANA_RPC_URLS[SOLANA_NETWORK as keyof typeof SOLANA_RPC_URLS] ||
  SOLANA_RPC_URLS['mainnet-beta'];

// Ethereum network constants (Wagmi will handle these, but we can define defaults)
export const DEFAULT_CHAIN_ID = 1; // Ethereum mainnet

// Storage key
export const WALLET_STORAGE_KEY = 'standalone-wallet-connection';

// Auto-reconnect settings
export const AUTO_RECONNECT_ENABLED = true;
export const AUTO_RECONNECT_TIMEOUT = 5000; // 5 seconds
