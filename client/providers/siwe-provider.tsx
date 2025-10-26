'use client'

import { SiweIdentityProvider } from 'ic-siwe-js/react'
import { useMemo, useEffect, useState } from 'react'
import { icSiweProviderCanisterId } from '@/constants/canisters-config'

export default function SiweProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const canisterId = useMemo(() => icSiweProviderCanisterId, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <SiweIdentityProvider canisterId={canisterId}>
      {children}
    </SiweIdentityProvider>
  );
}
