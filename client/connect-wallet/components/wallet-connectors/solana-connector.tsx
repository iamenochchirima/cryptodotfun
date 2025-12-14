"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { SOLANA_WALLETS } from "../../utils/wallet-config";

interface SolanaConnectorProps {
  onBack?: () => void;
}

export default function SolanaConnector({ onBack }: SolanaConnectorProps) {
  const {
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    select,
    connect,
    disconnect
  } = useWallet();

  const [error, setError] = useState<string | null>(null);

  // Wallet configuration mapping
  const getWalletConfig = (walletOption: any) => {
    const name = walletOption.adapter?.name?.toLowerCase() || '';

    if (name.includes('phantom')) {
      return { ...SOLANA_WALLETS.phantom, priority: 1 };
    }
    if (name.includes('solflare')) {
      return { ...SOLANA_WALLETS.solflare, priority: 2 };
    }
    if (name.includes('backpack')) {
      return { ...SOLANA_WALLETS.backpack, priority: 3 };
    }
    if (name.includes('glow')) {
      return { ...SOLANA_WALLETS.glow, priority: 4 };
    }

    // Fallback
    return {
      name: walletOption.adapter?.name || 'Unknown Wallet',
      icon: "/wallets/solana-sol-logo.png",
      description: `Connect using ${walletOption.adapter?.name}`,
      priority: 99,
    };
  };

  const handleWalletSelect = async (selectedWallet: any) => {
    try {
      setError(null);

      if (connected && wallet?.adapter.name === selectedWallet.adapter.name) {
        return;
      }

      if (connected && wallet?.adapter.name !== selectedWallet.adapter.name) {
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      select(selectedWallet.adapter.name);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!wallet || wallet.adapter.name !== selectedWallet.adapter.name) {
        select(selectedWallet.adapter.name);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (wallet && wallet.adapter.name === selectedWallet.adapter.name) {
        await connect();
      } else {
        throw new Error(`Failed to select ${selectedWallet.adapter.name} wallet`);
      }

    } catch (err: any) {
      const errorMessage = err.message || "";
      const isUserRejection = errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('cancelled');
      const isAlreadyConnected = errorMessage.includes('already connected') ||
        errorMessage.includes('already connecting');

      if (isUserRejection || (connected && isAlreadyConnected)) {
        setError(null);
        return;
      }

      console.error("Wallet connection error:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err: any) {
      console.error("Disconnect error:", err);
    }
  };

  const availableWallets = wallets
    .filter(wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable')
    .filter(wallet => {
      const name = wallet.adapter.name;
      const evmOnlyWallets = ['MetaMask', 'WalletConnect', 'Rainbow', 'Brave Wallet'];
      return !evmOnlyWallets.includes(name);
    })
    .map(wallet => ({ wallet, config: getWalletConfig(wallet) }))
    .sort((a, b) => a.config.priority - b.config.priority);

  return (
    <div className="space-y-4">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white">Back</span>
        </button>
      )}

      {/* Connection State: Not Connected */}
      {!connected && (
        <div className="space-y-3">
          {availableWallets.map(({ wallet: walletOption, config }) => {
            const isConnecting = connecting && wallet?.adapter.name === walletOption.adapter.name;

            return (
              <button
                key={walletOption.adapter.name}
                onClick={() => handleWalletSelect(walletOption)}
                disabled={connecting}
                className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 relative flex-shrink-0">
                    {isConnecting ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                      <Image
                        src={config.icon.trim()}
                        alt={config.name}
                        width={32}
                        height={32}
                        className="rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-logo.svg";
                        }}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {config.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </div>

                {isConnecting && (
                  <div className="text-xs text-primary">Connecting...</div>
                )}
              </button>
            );
          })}

          {availableWallets.length === 0 && (
            <div className="p-4 rounded-lg border bg-muted">
              <div className="text-sm text-muted-foreground text-center">
                No Solana wallets detected. Please install a Solana wallet extension.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
          <div className="text-sm text-destructive font-medium">Connection Error</div>
          <div className="text-xs text-destructive/80 mt-1">{error}</div>
        </div>
      )}

      {/* Connection State: Connected */}
      {connected && publicKey && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="text-xs text-muted-foreground">
              Connected to: {wallet?.adapter.name}
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {publicKey.toBase58()}
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
