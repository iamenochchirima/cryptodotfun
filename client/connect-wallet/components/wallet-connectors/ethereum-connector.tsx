"use client";

import { Connector, useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { ETHEREUM_WALLETS } from "../../utils/wallet-config";

interface EthereumConnectorProps {
  onBack?: () => void;
}

export default function EthereumConnector({ onBack }: EthereumConnectorProps) {
  const { connect, connectors, error, isPending, variables, reset } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    reset();
  }, [reset]);

  // Wallet configuration mapping
  const getWalletConfig = (connector: Connector) => {
    const id = connector.id.toLowerCase();
    const name = connector.name.toLowerCase();

    if (id.includes('metamask') || name.includes('metamask')) {
      return { ...ETHEREUM_WALLETS.metamask, priority: 1 };
    }
    if (id.includes('walletconnect') || name.includes('walletconnect')) {
      return { ...ETHEREUM_WALLETS.walletconnect, priority: 2 };
    }
    if (id.includes('coinbase') || name.includes('coinbase')) {
      return { ...ETHEREUM_WALLETS.coinbase, priority: 3 };
    }
    if (id.includes('rabby') || name.includes('rabby')) {
      return { ...ETHEREUM_WALLETS.rabby, priority: 4 };
    }
    if (id.includes('rainbow') || name.includes('rainbow')) {
      return { ...ETHEREUM_WALLETS.rainbow, priority: 5 };
    }
    if (id.includes('trust') || name.includes('trust')) {
      return { ...ETHEREUM_WALLETS.trust, priority: 6 };
    }
    if (id.includes('brave') || name.includes('brave')) {
      return { ...ETHEREUM_WALLETS.brave, priority: 7 };
    }
    if (id.includes('injected') || name.includes('injected') || name.includes('browser')) {
      return { ...ETHEREUM_WALLETS.injected, priority: 8 };
    }

    // Fallback
    return {
      name: connector.name,
      icon: connector.icon || "/placeholder-logo.svg",
      description: `Connect using ${connector.name}`,
      priority: 50,
    };
  };

  const isConnectorPending = (connector: Connector) => {
    return isPending && variables && "id" in variables.connector && connector.id === variables.connector.id;
  };

  const uniqueConnectors = connectors
    .filter((connector, index, arr) =>
      arr.findIndex(c => c.id === connector.id) === index
    )
    .map(connector => ({ connector, config: getWalletConfig(connector) }))
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
      {!isConnected && (
        <div className="space-y-3">
          {uniqueConnectors.map(({ connector, config }, index) => {
            const isPendingConnector = isConnectorPending(connector);

            return (
              <button
                key={`${connector.id}-${index}`}
                onClick={() => connect({ connector })}
                disabled={isConnected || isPending}
                className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 relative flex-shrink-0">
                    {isPendingConnector ? (
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

                {isPendingConnector && (
                  <div className="text-xs text-primary">Connecting...</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
          <div className="text-sm text-destructive font-medium">Connection Error</div>
          <div className="text-xs text-destructive/80 mt-1">{error.message}</div>
        </div>
      )}

      {/* Connection State: Connected */}
      {isConnected && address && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-green-500 font-medium">
              ✓ Wallet connected successfully!
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {address}
            </div>
            <button
              onClick={() => disconnect()}
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
