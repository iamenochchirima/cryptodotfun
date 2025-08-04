import { useAuth } from "@/providers/auth-context";
import { WalletType } from "@/providers/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSiws } from "ic-siws-js/react";
import { useEffect } from "react";

export default function SignInButton() {
  const {login : completeLogin} = useAuth();
  const { login, loginStatus, identity, clear, isLoginSuccess } = useSiws();
  const { wallet, disconnect, connected } = useWallet();

      useEffect(() => {
        if (connected && identity && isLoginSuccess) {
          completeLogin(WalletType.SIWS);
        }
      }, [connected, identity, isLoginSuccess]);

  if (!wallet) {
    return null;
  }

  const handleLogout = () => {
    disconnect();
    clear();
  };

  if (identity) {
    return <button onClick={handleLogout}>Logout</button>;
  }

  return (
    <button disabled={loginStatus === "logging-in"} onClick={login}>
      {loginStatus === "logging-in" ? "Signing in…" : "Sign in"}
    </button>
  );
}
