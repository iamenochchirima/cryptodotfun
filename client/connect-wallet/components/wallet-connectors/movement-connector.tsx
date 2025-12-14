"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useMovementWallet } from "../../hooks/useMovementWallet";
import { MOVEMENT_WALLETS } from "../../utils/wallet-config";

interface MovementConnectorProps {
  onBack?: () => void;
}

export default function MovementConnector({ onBack }: MovementConnectorProps) {
  const { wallets, wallet, account, connected, connect, disconnect } = useMovementWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wallet configuration mapping
  const getWalletConfig = (walletOption: any) => {
    const name = walletOption.name?.toLowerCase() || '';

    if (name.includes('nightly')) {
      return { ...MOVEMENT_WALLETS.nightly, priority: 1 };
    }
    if (name.includes('petra')) {
      return { ...MOVEMENT_WALLETS.petra, priority: 2 };
    }
    if (name.includes('martian')) {
      return { ...MOVEMENT_WALLETS.martian, priority: 3 };
    }
    if (name.includes('pontem')) {
      return { ...MOVEMENT_WALLETS.pontem, priority: 4 };
    }
    if (name.includes('fewcha')) {
      return { ...MOVEMENT_WALLETS.fewcha, priority: 5 };
    }

    // Fallback
    return {
      name: walletOption.name || 'Unknown Wallet',
      icon: "/placeholder-logo.svg",
      description: `Connect using ${walletOption.name}`,
      priority: 99,
    };
  };

  const handleWalletSelect = async (selectedWallet: any) => {
    setConnecting(selectedWallet.name);
    setError(null);

    try {
      if (connected && wallet?.name === selectedWallet.name) {
        setConnecting(null);
        return;
      }

      if (connected && wallet?.name !== selectedWallet.name) {
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await connect(selectedWallet.name);

    } catch (err: any) {
      const errorMessage = err.message || "";
      const isUserRejection = errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('cancelled');
      const isAlreadyConnected = errorMessage.includes('already connected') ||
        errorMessage.includes('already connecting');

      if (isUserRejection || (connected && isAlreadyConnected)) {
        setError(null);
      } else {
        setError(err.message || 'Failed to connect wallet');
        console.error("Movement wallet connection error:", err);
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
      console.error("Disconnect error:", err);
    }
  };

  const availableWallets = wallets
    .filter((w: any) => w.readyState === 'Installed' || w.readyState === 'Loadable')
    .map((w: any) => ({ wallet: w, config: getWalletConfig(w) }))
    .sort((a: any, b: any) => a.config.priority - b.config.priority);

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
          {availableWallets.map(({ wallet: walletOption, config }: any) => {
            const isConnecting = connecting === walletOption.name;

            return (
              <button
                key={walletOption.name}
                onClick={() => handleWalletSelect(walletOption)}
                disabled={!!connecting}
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
                No Movement wallets detected. Please install a Movement-compatible wallet extension.
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
      {connected && account?.address && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="text-xs text-muted-foreground">
              Connected to: {wallet?.name}
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {account.address.toString()}
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
