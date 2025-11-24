
import { useWallet } from "@solana/wallet-adapter-react";
import { SiwsIdentityProvider } from "ic-siws-js/react";
import { useMemo, useEffect, useState } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { icSiwsProviderCanisterId } from "@/constants/canisters-config";
import { host } from '../constants/urls';

export default function SiwsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { wallet } = useWallet();
  const [isReady, setIsReady] = useState(false);

  const adapter = useMemo<Adapter | undefined>(() => wallet?.adapter, [wallet?.adapter]);
  const canisterId = useMemo(() => icSiwsProviderCanisterId, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <SiwsIdentityProvider canisterId={canisterId} adapter={adapter} httpAgentOptions={{host}}>
      {children}
    </SiwsIdentityProvider>
  );
}