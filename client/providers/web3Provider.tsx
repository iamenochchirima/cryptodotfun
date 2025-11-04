'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './eth/wagmi/wagmi.config'
import SolanaProviders from '@/providers/solana-providers'
import SiwsProvider from '@/providers/siws-provider'
import SiweProvider from '@/providers/siwe-provider'
import { useState } from 'react'
import { AuthProvider } from './auth-context'
import {
  _SERVICE as siwbService,
} from "../declarations/ic_siwb_provider/ic_siwb_provider.did";
import { SiwbIdentityProvider } from 'ic-use-siwb-identity'

import { host } from '@/constants/urls'
import { icSiwbIDL, icSiwbProviderCanisterId } from '@/constants/canisters-config'

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 3,
      },
    },
  }))

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SiwbIdentityProvider<siwbService>
          canisterId={icSiwbProviderCanisterId}
          idlFactory={icSiwbIDL}
          httpAgentOptions={{ host }}
        >
          <SiweProvider>
            <SolanaProviders>
              <SiwsProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </SiwsProvider>
            </SolanaProviders>
          </SiweProvider>
        </SiwbIdentityProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}