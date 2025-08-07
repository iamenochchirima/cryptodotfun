import { useEffect, useState, useRef } from "react";
import { useSiwbIdentity } from 'ic-use-siwb-identity';
import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function BtcConnect() {
  const { login: completeLogin, logout } = useAuth();
  const { 
    prepareLogin, 
    isPrepareLoginIdle, 
    prepareLoginError, 
    loginError, 
    setWalletProvider, 
    login, 
    getAddress, 
    connectedBtcAddress, 
    identity 
  } = useSiwbIdentity();
  
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [manually, setManually] = useState<boolean>(false);
  const loginCompletedRef = useRef(false);

  useEffect(() => {
    if (connectedBtcAddress && identity && !loginCompletedRef.current) {
      loginCompletedRef.current = true;
      completeLogin(WalletType.SIWB);
    } else if (!connectedBtcAddress || !identity) {
      loginCompletedRef.current = false;
    }
  }, [connectedBtcAddress, identity, completeLogin]);

  // Clear errors when connection is successful or when wallet changes
  useEffect(() => {
    if (connectedBtcAddress) {
      setError(null);
    }
  }, [connectedBtcAddress]);

  // Handle prepareLogin errors
  useEffect(() => {
    if (prepareLoginError) {
      setError(prepareLoginError.message || "Prepare login failed");
      setConnecting(null);
    }
  }, [prepareLoginError]);

  // Handle login errors
  useEffect(() => {
    if (loginError) {
      setError(loginError.message || "Login failed");
      setConnecting(null);
    }
  }, [loginError]);

  // Preload a SIWB message on every address change and handle auto-login
  useEffect(() => {
    if (!isPrepareLoginIdle) return;
    const address = getAddress();
    console.log("Address from getAddress():", address);
    
    if (address) {
      prepareLogin();
      
      // Auto-login if we have address but no identity and user manually selected wallet
      if (connectedBtcAddress && !identity && manually) {
        (async () => {
          setConnecting("auto-login");
          try {
            const res = await login();
            if (res) {
              setManually(false);
              setConnecting(null);
              setError(null);
            } else {
              throw new Error("Auto-login failed");
            }
          } catch (err: any) {
            setError(err.message || "Auto-login failed");
            setConnecting(null);
          }
        })();
      }
    }
  }, [prepareLogin, isPrepareLoginIdle, getAddress, login, connectedBtcAddress, identity, manually]);

  // Custom wallet mapping with proper icons and display names
  const getWalletConfig = (walletType: string) => {
    const configs = {
      'unisat': {
        name: "Unisat",
        icon: "/placeholder-logo.svg",
        description: "Leading Bitcoin wallet extension"
      },
      'wizz': {
        name: "Wizz",
        icon: "/placeholder-logo.svg",
        description: "Bitcoin wallet for Web3"
      },
      'xverse': {
        name: "Xverse",
        icon: "/placeholder-logo.svg",
        description: "Bitcoin & Stacks wallet"
      },
      'BitcoinProvider': {
        name: "Xverse",
        icon: "/placeholder-logo.svg",
        description: "Bitcoin & Stacks wallet"
      }
    };

    return configs[walletType as keyof typeof configs] || {
      name: walletType,
      icon: "/placeholder-logo.svg",
      description: `Connect using ${walletType}`
    };
  };

  const handleWalletSelect = async (walletType: string) => {
    try {
      setError(null);
      setConnecting(walletType);
      setManually(true);
      
      await setWalletProvider(walletType as any);
      
      // The useEffect will handle the connection flow once the wallet provider is set
      
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to set wallet provider";
      setError(errorMessage);
      setConnecting(null);
      setManually(false);
      console.error("Wallet provider error:", err);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      setConnecting("signing-in");
      const result = await login();
      if (!result) {
        throw new Error("Sign in failed");
      }
      setConnecting(null);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setConnecting(null);
      console.error("Sign in error:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Clear SIWB identity and reset state
      setManually(false);
      setConnecting(null);
      setError(null);
      logout(); // This should handle clearing the auth state
    } catch (err: any) {
      console.error("Disconnect error:", err);
    }
  };

  // Available Bitcoin wallets
  const availableWallets = ['unisat', 'wizz', 'xverse'];

  console.log("Bitcoin Connect State:", { 
    connectedBtcAddress, 
    identity: identity?.getPrincipal().toText(),
    connecting,
    manually,
    isPrepareLoginIdle
  });

  return (
    <div className="space-y-4">
      {/* Connection State: Not Connected */}
      {!connectedBtcAddress && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Choose a Bitcoin wallet to connect
          </div>
          
          {availableWallets.map((walletType) => {
            const walletConfig = getWalletConfig(walletType);
            const isConnecting = connecting === walletType;
            
            return (
              <button
                key={walletType}
                onClick={() => handleWalletSelect(walletType)}
                disabled={!!connecting}
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
                  <div className="text-xs text-primary">
                    {connecting === "auto-login" ? "Signing in..." : "Connecting..."}
                  </div>
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
          <div className="text-xs text-destructive/80 mt-1">{error}</div>
        </div>
      )}

      {/* Connection State: Connected but Not Signed In */}
      {connectedBtcAddress && !identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {connectedBtcAddress}
            </div>
            <button
              onClick={handleSignIn}
              disabled={connecting === "signing-in"}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {connecting === "signing-in" ? "Signing In..." : "Sign In with Bitcoin"}
            </button>
          </div>
        </div>
      )}

      {/* Disconnect button when connected but not signed in */}
      {connectedBtcAddress && !identity && (
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
      {connectedBtcAddress && identity && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Successfully signed in with Bitcoin
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all mb-2">
              Address: {connectedBtcAddress}
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
