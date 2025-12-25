"use client"

import { useState } from "react"
import { X, Wallet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { WalletType } from "@/providers/types"
import { connectInternetIdentityWallet } from "@/providers/internetidentity"
import { connectNFIDWallet } from "@/providers/nfid"
import { useAuth } from "@/providers/auth-context"

interface WalletConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const { login } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletConnectCallback = (success: boolean, walletType: WalletType) => {
    if (success) {
      login(walletType)
      onClose()
    }
  }

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    if (walletId === 'internet-identity') {
      connectInternetIdentityWallet(walletConnectCallback);
    } else if (walletId === 'nfid') {
      connectNFIDWallet(walletConnectCallback);
    }
  };

  const handleBack = () => {
    setSelectedWallet(null);
    setError(null);
  };

  const handleClose = () => {
    if (!connecting) {
      setError(null)
      setSelectedWallet(null);
      setConnecting(false)
      onClose()
    }
  }

  if (isOpen) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = "unset"
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div
          className="w-full max-w-md bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Connect Your Wallet</h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                disabled={connecting}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Choose a wallet to connect to CryptoDotFun</p>
          </div>

          {/* Modal Content */}
          <div className="p-6 pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!selectedWallet && <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("internet-identity")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/icp.png"
                    alt="Internet Identity"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Internet Identity</span>
              </Button>

              {/* <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("ethereum")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/etherium.png"
                    alt="Ethereum"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Sign In with Ethereum</span>
              </Button> */}

              {/* <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("solana")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/solana-sol-logo.png"
                    alt="Solana"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Sign In With Solana</span>
              </Button> */}

              {/* <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("bitcoin")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/bitcoin.png"
                    alt="Bitcoin"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Sign In with Bitcoin</span>
              </Button> */}

              <Button
                variant="outline"
                className="w-full flex items-center justify-start h-14 px-4 hover:border-primary hover:text-primary bg-transparent"
                onClick={() => handleWalletSelect("nfid")}
                disabled={connecting}
              >
                <div className="w-8 h-8 mr-3 relative">
                  <Image
                    src="/wallets/email.png"
                    alt="NFID"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Sign in with Email (NFID)</span>
              </Button>

            </div>
            }

            {/* {selectedWallet && selectedWallet === "ethereum" && <EthConnect onBack={handleBack} />}
            {selectedWallet && selectedWallet === "solana" && <SolConnect onBack={handleBack} />}
            {selectedWallet && selectedWallet === "bitcoin" && <BtcConnect onBack={handleBack} />} */}

            {connecting && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
