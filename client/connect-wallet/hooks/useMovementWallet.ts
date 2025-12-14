"use client";

import { useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useWalletConnectionContext } from '../context/wallet-connection-context';
import { MovementWalletType } from '../types';

/**
 * Hook for Movement wallet operations
 * Bridges Aptos/Movement wallet adapter with the wallet connection context
 */
export function useMovementWallet() {
  const { account, connected, wallet, connect, disconnect, wallets } = useWallet();
  const { updateWalletState, disconnectRequested } = useWalletConnectionContext();

  // Determine wallet type from wallet name
  const determineWalletType = (): MovementWalletType | null => {
    if (!wallet) return null;

    const name = wallet.name.toLowerCase();

    if (name.includes('nightly')) return 'nightly';
    if (name.includes('petra')) return 'petra';
    if (name.includes('martian')) return 'martian';
    if (name.includes('pontem')) return 'pontem';
    if (name.includes('fewcha')) return 'fewcha';

    return 'nightly'; // Default to nightly for unknown Movement wallets
  };

  // Watch for disconnect requests from context
  useEffect(() => {
    if (disconnectRequested && connected) {
      disconnect();
    }
  }, [disconnectRequested, connected, disconnect]);

  // Update wallet context when Movement wallet connects/disconnects
  useEffect(() => {
    if (connected && account?.address) {
      const walletType = determineWalletType();
      updateWalletState({
        isConnected: true,
        chain: 'movement',
        walletType,
        address: account.address.toString(),
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
  }, [connected, account, wallet, updateWalletState]);

  return {
    account,
    connected,
    wallet,
    wallets,
    connect,
    disconnect,
    address: account?.address?.toString() || null,
  };
}
