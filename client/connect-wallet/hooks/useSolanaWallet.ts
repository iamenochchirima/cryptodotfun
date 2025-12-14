"use client";

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletConnectionContext } from '../context/wallet-connection-context';
import { SolanaWalletType } from '../types';

/**
 * Hook for Solana wallet operations
 * Bridges Solana wallet adapter with the wallet connection context
 */
export function useSolanaWallet() {
  const { publicKey, connected, wallet, connect, disconnect, select } = useWallet();
  const { updateWalletState, disconnectRequested } = useWalletConnectionContext();

  // Determine wallet type from wallet adapter name
  const determineWalletType = (): SolanaWalletType | null => {
    if (!wallet) return null;

    const name = wallet.adapter.name.toLowerCase();

    if (name.includes('phantom')) return 'phantom';
    if (name.includes('solflare')) return 'solflare';
    if (name.includes('backpack')) return 'backpack';
    if (name.includes('glow')) return 'glow';

    return 'phantom'; // Default to phantom for unknown Solana wallets
  };

  // Watch for disconnect requests from context
  useEffect(() => {
    if (disconnectRequested && connected) {
      disconnect();
    }
  }, [disconnectRequested, connected, disconnect]);

  // Update wallet context when Solana wallet connects/disconnects
  useEffect(() => {
    if (connected && publicKey) {
      const walletType = determineWalletType();
      updateWalletState({
        isConnected: true,
        chain: 'solana',
        walletType,
        address: publicKey.toBase58(),
        connectionTimestamp: Date.now(),
      });
    } else if (!connected) {
      // Wallet was disconnected
      updateWalletState({
        isConnected: false,
        chain: null,
        walletType: null,
        address: null,
        connectionTimestamp: null,
      });
    }
  }, [connected, publicKey, wallet, updateWalletState]);

  return {
    publicKey,
    connected,
    wallet,
    connect,
    disconnect,
    select,
    address: publicKey?.toBase58() || null,
  };
}
