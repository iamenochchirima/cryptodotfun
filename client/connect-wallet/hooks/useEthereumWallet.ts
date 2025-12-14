"use client";

import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi';
import { useWalletConnectionContext } from '../context/wallet-connection-context';
import { EthereumWalletType } from '../types';

/**
 * Hook for Ethereum wallet operations
 * Bridges Wagmi hooks with the wallet connection context
 */
export function useEthereumWallet() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { updateWalletState, disconnectRequested } = useWalletConnectionContext();

  // Determine wallet type from connector
  const determineWalletType = (): EthereumWalletType | null => {
    if (!connector) return null;

    const id = connector.id.toLowerCase();
    const name = connector.name.toLowerCase();

    if (id.includes('metamask') || name.includes('metamask')) return 'metamask';
    if (id.includes('walletconnect') || name.includes('walletconnect')) return 'walletconnect';
    if (id.includes('coinbase') || name.includes('coinbase')) return 'coinbase';
    if (id.includes('brave') || name.includes('brave')) return 'brave';
    if (id.includes('rabby') || name.includes('rabby')) return 'rabby';
    if (id.includes('rainbow') || name.includes('rainbow')) return 'rainbow';
    if (id.includes('trust') || name.includes('trust')) return 'trust';
    if (id.includes('injected') || name.includes('injected') || name.includes('browser')) return 'injected';

    return 'injected'; // Default to injected for unknown wallets
  };

  // Watch for disconnect requests from context
  useEffect(() => {
    if (disconnectRequested && isConnected) {
      disconnect();
    }
  }, [disconnectRequested, isConnected, disconnect]);

  // Update wallet context when Ethereum wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      const walletType = determineWalletType();
      updateWalletState({
        isConnected: true,
        chain: 'ethereum',
        walletType,
        address,
        connectionTimestamp: Date.now(),
      });
    } else if (!isConnected) {
      // Wallet was disconnected
      updateWalletState({
        isConnected: false,
        chain: null,
        walletType: null,
        address: null,
        connectionTimestamp: null,
      });
    }
  }, [isConnected, address, connector, updateWalletState]);

  return {
    address,
    isConnected,
    connector,
    connectors,
    connect,
    disconnect,
  };
}
