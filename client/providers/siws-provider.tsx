
import { useWallet } from "@solana/wallet-adapter-react";
import { SiwsIdentityProvider } from "ic-siws-js/react";
import { useMemo, useEffect, useState } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { usersCanisterId } from "@/constants/canisters-config";

export default function SiwsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { wallet } = useWallet();
  const [isReady, setIsReady] = useState(false);

  // Memoize values to prevent unnecessary re-renders
  const adapter = useMemo<Adapter | undefined>(() => wallet?.adapter, [wallet?.adapter]);
  const canisterId = useMemo(() => usersCanisterId, []);

  useEffect(() => {
    // Delay initialization to prevent render conflicts - shorter delay than SiweProvider
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <SiwsIdentityProvider canisterId={canisterId} adapter={adapter}>
      {children}
    </SiwsIdentityProvider>
  );
}