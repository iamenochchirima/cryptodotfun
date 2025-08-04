import { Connector, useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect } from "react";
import { useSiwe } from "ic-siwe-js/react";
import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function EthConnect() {
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
    const configs = {
      metaMask: {
        name: "MetaMask",
        icon: "/metamask-fox-logo.png",
        description: "Connect using MetaMask browser extension"
      },
      walletConnect: {
        name: "WalletConnect",
        icon: "/walletconnect-icon.png", 
        description: "Scan QR code to connect your mobile wallet"
      },
      coinbaseWallet: {
        name: "Coinbase Wallet",
        icon: "/placeholder-logo.svg",
        description: "Connect using Coinbase Wallet"
      },
      injected: {
        name: "Browser Wallet",
        icon: "/placeholder-logo.svg",
        description: "Connect using your browser's wallet"
      }
    };

    const config = configs[connector.id as keyof typeof configs] || {
      name: connector.name,
      icon: connector.icon || "/placeholder-logo.svg",
      description: `Connect using ${connector.name}`
    };

    // Clean up the icon URL and handle data URLs
    let cleanIcon = config.icon;
    if (typeof cleanIcon === 'string') {
      cleanIcon = cleanIcon.trim();
      // If it's a data URL, use a fallback icon instead
      if (cleanIcon.startsWith('data:')) {
        cleanIcon = "/placeholder-logo.svg";
      }
    } else {
      cleanIcon = "/placeholder-logo.svg";
    }

    return {
      ...config,
      icon: cleanIcon
    };
  };

  const isConnectorPending = (connector: Connector) => {
    return isPending && variables && "id" in variables.connector && connector.id === variables.connector.id;
  };

  console.log("Identity in EthConnect:", { identity, isLoginSuccess, isConnected });

  // Remove duplicate connectors based on their ID
  const uniqueConnectors = connectors.filter((connector, index, arr) => 
    arr.findIndex(c => c.id === connector.id) === index
  );

  return (
    <div className="space-y-4">
      {/* Connection State: Not Connected */}
      {!isConnected && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Choose an Ethereum wallet to connect
          </div>
          
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
