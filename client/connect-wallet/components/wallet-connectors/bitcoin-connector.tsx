"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBitcoinWallet } from "../../hooks/useBitcoinWallet";
import { BITCOIN_WALLETS } from "../../utils/wallet-config";
import { BitcoinWalletType } from "../../types";

interface BitcoinConnectorProps {
  onBack?: () => void;
}

export default function BitcoinConnector({ onBack }: BitcoinConnectorProps) {
  const { address, connected, availableWallets, connect, disconnect } = useBitcoinWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletType: BitcoinWalletType) => {
    setConnecting(walletType);
    setError(null);

    try {
      await connect(walletType);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error("Bitcoin wallet connection error:", err);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      disconnect();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect wallet');
      console.error("Disconnect error:", err);
    }
  };

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
          {availableWallets.map((wallet) => {
            const config = BITCOIN_WALLETS[wallet.type];
            const isConnecting = connecting === wallet.type;

            return (
              <button
                key={wallet.type}
                onClick={() => handleConnect(wallet.type)}
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
                No Bitcoin wallets detected. Please install a Bitcoin wallet extension.
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
      {connected && address && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {address}
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
