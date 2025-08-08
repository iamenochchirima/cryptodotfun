import { Connector, useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect } from "react";
import { useSiwe } from "ic-siwe-js/react";
import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface EthConnectProps {
  onBack?: () => void;
}

export default function EthConnect({ onBack }: EthConnectProps) {
  const { login: completeLogin, logout } = useAuth();
  const { connect, connectors, error, isPending, variables, reset } = useConnect();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { login, clear, identity, isLoginSuccess } = useSiwe();

  useEffect(() => {
    if (isConnected && identity && isLoginSuccess) {
      completeLogin(WalletType.SIWE);
    }
  }, [isConnected, identity, isLoginSuccess, completeLogin]);

  useEffect(() => {
    reset();
  }, [reset]);

  // Custom wallet connector mapping with proper icons and display names
  const getWalletConfig = (connector: Connector) => {
    const id = connector.id.toLowerCase();
    const name = connector.name.toLowerCase();

    // MetaMask
    if (id.includes('metamask') || name.includes('metamask')) {
      return {
        name: "MetaMask",
        icon: "/wallets/metamask.svg",
        description: "The most popular Ethereum wallet"
      };
    }

    // WalletConnect
    if (id.includes('walletconnect') || name.includes('walletconnect')) {
      return {
        name: "WalletConnect",
        icon: "/wallets/walletconnect.png",
        description: "Connect mobile wallets via QR code"
      };
    }

    // Coinbase
    if (id.includes('coinbase') || name.includes('coinbase')) {
      return {
        name: "Coinbase Wallet",
        icon: "/placeholder-logo.svg",
        description: "Self-custody wallet by Coinbase"
      };
    }

    // Brave
    if (id.includes('brave') || name.includes('brave')) {
      return {
        name: "Brave Wallet",
        icon: "/wallets/brave.png",
        description: "Built-in Brave browser wallet"
      };
    }

    // Rabby
    if (id.includes('rabby') || name.includes('rabby')) {
      return {
        name: "Rabby",
        icon: "/placeholder-logo.svg",
        description: "Multi-chain DeFi wallet"
      };
    }

    // Rainbow
    if (id.includes('rainbow') || name.includes('rainbow')) {
      return {
        name: "Rainbow",
        icon: "/placeholder-logo.svg",
        description: "Ethereum wallet for DeFi & NFTs"
      };
    }

    // Trust Wallet
    if (id.includes('trust') || name.includes('trust')) {
      return {
        name: "Trust Wallet",
        icon: "/placeholder-logo.svg",
        description: "Multi-chain mobile wallet"
      };
    }

    // Solana wallets (show but deprioritize)
    if (id.includes('phantom') || name.includes('phantom')) {
      return {
        name: "Phantom",
        icon: "/wallets/phantom.png",
        description: "Multi-chain wallet (primarily Solana)"
      };
    }

    // Generic/Browser wallets
    if (id.includes('injected') || name.includes('injected') || name.includes('browser')) {
      return {
        name: "Browser Wallet",
        icon: "/placeholder-logo.svg",
        description: "Connect using your browser's wallet"
      };
    }

    // Fallback for unknown connectors
    return {
      name: connector.name,
      icon: connector.icon || "/placeholder-logo.svg",
      description: `Connect using ${connector.name}`
    };
  };

  const isConnectorPending = (connector: Connector) => {
    return isPending && variables && "id" in variables.connector && connector.id === variables.connector.id;
  };

  const uniqueConnectors = connectors
    .filter((connector, index, arr) =>
      arr.findIndex(c => c.id === connector.id) === index
    )
    .sort((a, b) => {
      const getPriority = (connector: Connector) => {
        const id = connector.id.toLowerCase();
        const name = connector.name.toLowerCase();

        if (id.includes('metamask') || name.includes('metamask')) return 1;


        if (id.includes('walletconnect') || name.includes('walletconnect')) return 2;


        if (id.includes('coinbase') || name.includes('coinbase')) return 3;


        if (id.includes('rabby') || name.includes('rabby')) return 4;
        if (id.includes('rainbow') || name.includes('rainbow')) return 5;
        if (id.includes('trust') || name.includes('trust')) return 6;
        if (id.includes('brave') || name.includes('brave')) return 7;

        if (id.includes('injected') || name.includes('injected') || name.includes('browser')) return 8;

        if (id.includes('phantom') || name.includes('phantom')) return 99;
        if (id.includes('solflare') || name.includes('solflare')) return 99;
        if (id.includes('backpack') || name.includes('backpack')) return 99;

        // Unknown wallets
        return 50;
      };

      return getPriority(a) - getPriority(b);
    });

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

          {uniqueConnectors.map((connector, index) => {
            const walletConfig = getWalletConfig(connector);
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
                        src={walletConfig.icon}
                        alt={walletConfig.name}
                        width={32}
                        height={32}
                        className="rounded-md"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = "/placeholder-logo.svg";
                        }}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {walletConfig.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {walletConfig.description}
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

      {/* Connection State: Connected but Not Signed In */}
      {isConnected && !identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <button
              onClick={login}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In with Ethereum
            </button>
          </div>
        </div>
      )}
      {/* Disconnet button */}
      {isConnected && !identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <button
              onClick={() => disconnect()}
              className="w-full px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
      {/* Connection State: Fully Connected and Signed In */}
      {isConnected && identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Successfully signed in with Ethereum
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {identity.getPrincipal().toText()}
            </div>
            <button
              onClick={logout}
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
