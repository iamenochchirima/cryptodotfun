import { useEffect, useState, useRef } from "react";
import { useSiwbIdentity } from 'ic-use-siwb-identity';
import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";

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
    identityAddress,
    identity 
  } = useSiwbIdentity();
  
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [manually, setManually] = useState<boolean>(false);
  const loginCompletedRef = useRef(false);


     useEffect(() => {
    if (identityAddress && identity) {
      loginCompletedRef.current = true;
      completeLogin(WalletType.SIWB);
    } else if (!identityAddress || !identity) {
      loginCompletedRef.current = false;
    }
  }, [ identity, identityAddress,  ]);

  useEffect(() => {
    if (connectedBtcAddress && identity && !loginCompletedRef.current) {
      loginCompletedRef.current = true;
      completeLogin(WalletType.SIWB);
    } else if (!connectedBtcAddress || !identity) {
      loginCompletedRef.current = false;
    }
  }, [connectedBtcAddress, identity]);

  // Clear errors when connection is successful or when wallet changes
  useEffect(() => {
    if (connectedBtcAddress) {
      setError(null);
    }
  }, [connectedBtcAddress]);

  // Handle prepareLogin error
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
      console.log("🔥 Disconnecting BTC wallet 🔥");
      // Reset local state first
      setManually(false);
      setConnecting(null);
      setError(null);
      loginCompletedRef.current = false;
      
      // This should handle clearing the auth state and call siwbClear()
      logout(); 
    } catch (err: any) {
      console.error("Disconnect error:", err);
    }
  };


  return (
    <div className="space-y-4">
      {/* Connection State: Not Connected */}
      {!connectedBtcAddress && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Choose a Bitcoin wallet to connect
          </div>
          
          <button
            className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
            onClick={async () => {
              setManually(true);
              await setWalletProvider('unisat');
            }}
          >
            Unisat Wallet
          </button>

          <button
            className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
            onClick={async () => {
              setManually(true);
              await setWalletProvider('wizz');
            }}
          >
            Wizz Wallet
          </button>

          <button
            className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
            onClick={async () => {
              setManually(true);
              await setWalletProvider('BitcoinProvider');
            }}
          >
            Xverse Wallet
          </button>
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
