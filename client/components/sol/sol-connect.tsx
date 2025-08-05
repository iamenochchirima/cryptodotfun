import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useRef } from "react";
import { useSiws } from "ic-siws-js/react";
import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function SolConnect() {
  const { login: completeLogin, logout } = useAuth();
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
  
  const { identity, login, clear, isLoginSuccess } = useSiws();
  const [error, setError] = useState<string | null>(null);
  const loginCompletedRef = useRef(false);

  useEffect(() => {
    if (connected && identity && isLoginSuccess && !loginCompletedRef.current) {
      loginCompletedRef.current = true;
      completeLogin(WalletType.SIWS);
    } else if (!connected || !identity || !isLoginSuccess) {
      loginCompletedRef.current = false;
    }
  }, [connected, identity, isLoginSuccess]);

  useEffect(() => {
    if (connected) {
      setError(null);
    }
  }, [connected, wallet?.adapter.name]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (connected && wallet) {
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getWalletConfig = (walletItem: any) => {
    const configs = {
      'Phantom': {
        name: "Phantom",
        icon: "/phantom-wallet-logo.png",
        description: "The most popular Solana wallet"
      },
      'Solflare': {
        name: "Solflare",
        icon: "/placeholder-logo.svg", 
        description: "Native Solana wallet with staking"
      },
      'Backpack': {
        name: "Backpack",
        icon: "/placeholder-logo.svg",
        description: "Multi-chain wallet for Solana & Ethereum"
      },
      'Glow': {
        name: "Glow",
        icon: "/placeholder-logo.svg",
        description: "Solana-first wallet with DeFi focus"
      },
      'Slope': {
        name: "Slope",
        icon: "/placeholder-logo.svg",
        description: "Mobile-first Solana wallet"
      },
      'Torus': {
        name: "Torus",
        icon: "/placeholder-logo.svg",
        description: "Social login for Solana"
      },
      'Trust Wallet': {
        name: "Trust Wallet", 
        icon: "/placeholder-logo.svg",
        description: "Multi-chain mobile wallet"
      },
      'Exodus': {
        name: "Exodus",
        icon: "/placeholder-logo.svg",
        description: "Desktop & mobile crypto wallet"
      },
      'Coinbase Wallet': {
        name: "Coinbase Wallet",
        icon: "/placeholder-logo.svg",
        description: "Self-custody wallet by Coinbase"
      }
    };

    const config = configs[walletItem.adapter.name as keyof typeof configs] || {
      name: walletItem.adapter.name,
      icon: walletItem.adapter.icon || "/placeholder-logo.svg",
      description: `Connect using ${walletItem.adapter.name}`
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
      
      // Only connect if we have a selected wallet
      if (wallet && wallet.adapter.name === selectedWallet.adapter.name) {
        await connect();
      } else {
        throw new Error(`Failed to select ${selectedWallet.adapter.name} wallet`);
      }
      
    } catch (err: any) {
      // Filter out common non-error scenarios
      const errorMessage = err.message || "";
      const isUserRejection = errorMessage.includes('User rejected') || 
                             errorMessage.includes('User denied') ||
                             errorMessage.includes('cancelled');
      const isAlreadyConnected = errorMessage.includes('already connected') || 
                                errorMessage.includes('already connecting');
      const isNotSelectedError = errorMessage.includes('WalletNotSelectedError') ||
                                errorMessage.includes('No wallet selected');
      
      // Don't show errors for user cancellation or if already connected
      if (isUserRejection || (connected && isAlreadyConnected)) {
        setError(null);
        return;
      }
      
      // For wallet not selected errors, try one more time
      if (isNotSelectedError && !connected) {
        try {
          select(selectedWallet.adapter.name);
          await new Promise(resolve => setTimeout(resolve, 500));
          await connect();
          setError(null);
          return;
        } catch (retryErr: any) {
          console.error("Retry failed:", retryErr);
        }
      }
      
    //   // Only set error for actual connection failures when not connected
    //   if (!connected) {
    //     setError(errorMessage || "Failed to connect to wallet");
    //     console.error("Wallet connection error:", err);
    //   }
    }
  };

  const handleDisconnect = async () => {
    try {
      clear(); // Clear SIWS identity
      await disconnect(); // Disconnect wallet
      logout(); // Clear auth state
    } catch (err: any) {
      console.error("Disconnect error:", err);
    }
  };

  const availableWallets = wallets
    .filter(wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable')
    .sort((a, b) => {
      // Define priority order for Solana wallets
      const priority = {
        'Phantom': 1,
        'Solflare': 2,
        'Backpack': 3,
        'Glow': 4,
        'Slope': 5,
        'Torus': 6,
        'Trust Wallet': 7,
        'Exodus': 8,
        'Coinbase Wallet': 9,
      };
      
      const aPriority = priority[a.adapter.name as keyof typeof priority] || 99;
      const bPriority = priority[b.adapter.name as keyof typeof priority] || 99;
      
      return aPriority - bPriority;
    })

    .filter(wallet => {
      const name = wallet.adapter.name;
      const evmOnlyWallets = ['MetaMask', 'WalletConnect', 'Rainbow', 'Brave Wallet'];
      return !evmOnlyWallets.includes(name);
    });

  console.log("Solana Connect State:", { 
    connected, 
    publicKey: publicKey?.toBase58(), 
    identity: identity?.getPrincipal().toText(),
    isLoginSuccess,
    wallet: wallet?.adapter.name 
  });

  return (
    <div className="space-y-4">
      {/* Connection State: Not Connected */}
      {!connected && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Choose a Solana wallet to connect
          </div>
          
          {availableWallets.map((walletOption) => {
            const walletConfig = getWalletConfig(walletOption);
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

      {/* Connection State: Connected but Not Signed In */}
      {connected && !identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="text-xs text-muted-foreground">
              Connected to: {wallet?.adapter.name}
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {publicKey?.toBase58()}
            </div>
            <button
              onClick={login}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In with Solana
            </button>
          </div>
        </div>
      )}

      {/* Disconnect button when connected but not signed in */}
      {connected && !identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}

      {/* Connection State: Fully Connected and Signed In */}
      {connected && identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Successfully signed in with Solana
            </div>
            <div className="text-xs text-muted-foreground">
              Wallet: {wallet?.adapter.name}
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all mb-2">
              Address: {publicKey?.toBase58()}
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              Identity: {identity.getPrincipal().toText()}
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
