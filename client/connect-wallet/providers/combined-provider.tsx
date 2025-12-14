"use client";

import { ReactNode } from 'react';
import { EthereumProvider } from './ethereum-provider';
import { SolanaProvider } from './solana-provider';
import { MovementProvider } from './movement-provider';
import { WalletConnectionProvider } from '../context/wallet-connection-context';
import { useEthereumWallet } from '../hooks/useEthereumWallet';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useMovementWallet } from '../hooks/useMovementWallet';

interface CombinedWalletProviderProps {
  children: ReactNode;
}

/**
 * Hook initializer component that ensures all wallet hooks are active
 */
function WalletHookInitializer({ children }: { children: ReactNode }) {
  // Initialize all wallet hooks so they can sync with the global state
  useEthereumWallet();
  useSolanaWallet();
  useBitcoinWallet();
  useMovementWallet();

  return <>{children}</>;
}

/**
 * Combined provider that wraps all chain-specific providers and the wallet connection context
 *
 * Provider hierarchy:
 * - EthereumProvider (Wagmi + QueryClient)
 *   - SolanaProvider (Solana wallet adapter)
 *     - MovementProvider (Aptos/Movement wallet adapter)
 *       - WalletConnectionProvider (Wallet state management)
 *         - WalletHookInitializer (Activates all wallet hooks)
 */
export function CombinedWalletProvider({ children }: CombinedWalletProviderProps) {
  return (
    <EthereumProvider>
      <SolanaProvider>
        <MovementProvider>
          <WalletConnectionProvider>
            <WalletHookInitializer>
              {children}
            </WalletHookInitializer>
          </WalletConnectionProvider>
        </MovementProvider>
      </SolanaProvider>
    </EthereumProvider>
  );
}

// Export with a more user-friendly name
export { CombinedWalletProvider as WalletConnectionProvider };
