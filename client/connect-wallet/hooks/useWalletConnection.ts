"use client";

import { useWalletConnectionContext } from '../context/wallet-connection-context';

/**
 * Main hook for accessing wallet connection state and actions
 *
 * @returns Wallet connection context with state, actions, and helper getters
 *
 * @example
 * const { walletState, disconnectWallet } = useWalletConnection();
 * if (walletState.isConnected) {
 *   console.log(`Connected to ${walletState.chain} with ${walletState.address}`);
 * }
 */
export function useWalletConnection() {
  return useWalletConnectionContext();
}
