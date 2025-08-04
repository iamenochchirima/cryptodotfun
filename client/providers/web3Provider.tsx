'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './eth/wagmi/wagmi.config'
import SolanaProviders from '@/providers/solana-providers'
import SiwsProvider from '@/providers/siws-provider'
import SiweProvider from '@/providers/siwe-provider'
import { useState } from 'react'
import { AuthProvider } from './auth-context'

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
        <SiweProvider>
          <SolanaProviders>
            <SiwsProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </SiwsProvider>
          </SolanaProviders>
        </SiweProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}