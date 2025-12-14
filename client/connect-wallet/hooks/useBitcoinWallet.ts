"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWalletConnectionContext } from '../context/wallet-connection-context';
import { BitcoinWalletType } from '../types';

// Extend Window interface for Bitcoin wallets
declare global {
  interface Window {
    unisat?: any;
    XverseProviders?: any;
    okxwallet?: any;
    wizz?: any;
    LeatherProvider?: any;
  }
}

interface BitcoinWallet {
  type: BitcoinWalletType;
  name: string;
  installed: boolean;
}

/**
 * Hook for Bitcoin wallet operations
 * Custom implementation for pure Bitcoin wallet connections
 */
export function useBitcoinWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<BitcoinWalletType | null>(null);
  const { updateWalletState, disconnectRequested } = useWalletConnectionContext();

  // Detect available Bitcoin wallets
  const detectWallets = useCallback((): BitcoinWallet[] => {
    const wallets: BitcoinWallet[] = [
      {
        type: 'unisat',
        name: 'Unisat',
        installed: typeof window !== 'undefined' && typeof window.unisat !== 'undefined',
      },
      {
        type: 'xverse',
        name: 'Xverse',
        installed: typeof window !== 'undefined' && typeof window.XverseProviders !== 'undefined',
      },
      {
        type: 'okx',
        name: 'OKX Wallet',
        installed: typeof window !== 'undefined' && typeof window.okxwallet !== 'undefined',
      },
      {
        type: 'wizz',
        name: 'Wizz',
        installed: typeof window !== 'undefined' && typeof window.wizz !== 'undefined',
      },
      {
        type: 'leather',
        name: 'Leather',
        installed: typeof window !== 'undefined' && typeof window.LeatherProvider !== 'undefined',
      },
    ];

    return wallets.filter((w) => w.installed);
  }, []);

  // Connect to a specific Bitcoin wallet
  const connect = useCallback(async (walletType: BitcoinWalletType) => {
    if (typeof window === 'undefined') {
      throw new Error('Window is not defined');
    }

    try {
      let accounts: string[] = [];

      switch (walletType) {
        case 'unisat':
          if (!window.unisat) throw new Error('Unisat wallet not found');
          accounts = await window.unisat.requestAccounts();
          break;

        case 'xverse':
          if (!window.XverseProviders) throw new Error('Xverse wallet not found');
          // Xverse has a different API
          const xverseProvider = window.XverseProviders?.BitcoinProvider;
          if (xverseProvider) {
            const response = await xverseProvider.request('getAccounts', null);
            accounts = response?.result?.addresses || [];
          }
          break;

        case 'okx':
          if (!window.okxwallet) throw new Error('OKX wallet not found');
          accounts = await window.okxwallet.bitcoin.requestAccounts();
          break;

        case 'wizz':
          if (!window.wizz) throw new Error('Wizz wallet not found');
          accounts = await window.wizz.requestAccounts();
          break;

        case 'leather':
          if (!window.LeatherProvider) throw new Error('Leather wallet not found');
          const leatherAccounts = await window.LeatherProvider.request('getAccounts');
          accounts = leatherAccounts?.result || [];
          break;

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        setAddress(walletAddress);
        setConnected(true);
        setCurrentWallet(walletType);

        // Update global wallet context
        updateWalletState({
          isConnected: true,
          chain: 'bitcoin',
          walletType,
          address: walletAddress,
          connectionTimestamp: Date.now(),
        });

        return walletAddress;
      }

      throw new Error('No accounts found');
    } catch (error) {
      console.error('Failed to connect Bitcoin wallet:', error);
      throw error;
    }
  }, [updateWalletState]);

  // Disconnect Bitcoin wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setCurrentWallet(null);
    // Update global wallet state
    updateWalletState({
      isConnected: false,
      chain: null,
      walletType: null,
      address: null,
      connectionTimestamp: null,
    });
  }, [updateWalletState]);

  // Watch for disconnect requests from context
  useEffect(() => {
    if (disconnectRequested && connected) {
      disconnect();
    }
  }, [disconnectRequested, connected, disconnect]);

  return {
    address,
    connected,
    currentWallet,
    availableWallets: detectWallets(),
    connect,
    disconnect,
  };
}
