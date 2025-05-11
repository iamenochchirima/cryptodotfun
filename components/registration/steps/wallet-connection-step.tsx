"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setWalletInfo, nextStep } from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function WalletConnectionStep() {
  const dispatch = useAppDispatch()
  const { walletConnected, walletAddress } = useAppSelector((state) => state.registration)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async (walletType: string) => {
    setConnecting(true)
    setError(null)

    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock wallet address based on wallet type
      let address = ""
      switch (walletType) {
        case "metamask":
          address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
          break
        case "phantom":
          address = "5FHwkrdxkRXnQsZC3Qo369ULSBpMJXqYhpJ6GKvdKmr5"
          break
        case "walletconnect":
          address = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
          break
        case "coinbase":
          address = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
          break
        default:
          address = "0x1234567890abcdef1234567890abcdef12345678"
      }

      dispatch(setWalletInfo({ connected: true, address }))
    } catch (err) {
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setConnecting(false)
    }
  }

  const handleContinue = () => {
    dispatch(nextStep())
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground mt-2">Connect your wallet to start the registration process</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 py-4">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
          onClick={() => connectWallet("metamask")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mb-2 relative">
            <Image src="/metamask-fox-logo.png" alt="MetaMask" fill className="object-contain" />
          </div>
          <span>MetaMask</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
          onClick={() => connectWallet("phantom")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mb-2 relative">
            <Image src="/phantom-wallet-logo.png" alt="Phantom" fill className="object-contain" />
          </div>
          <span>Phantom</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
          onClick={() => connectWallet("walletconnect")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mb-2 relative">
            <Image src="/walletconnect-icon.png" alt="WalletConnect" fill className="object-contain" />
          </div>
          <span>WalletConnect</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
          onClick={() => connectWallet("coinbase")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mb-2 relative">
            <Image src="/abstract-crypto-wallet.png" alt="Coinbase" fill className="object-contain" />
          </div>
          <span>Coinbase</span>
        </Button>
      </div>

      {walletConnected && (
        <div className="bg-muted p-4 rounded-md flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-green-500" />
          <div>
            <p className="font-medium">Wallet Connected</p>
            <p className="text-sm text-muted-foreground truncate">{walletAddress}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!walletConnected || connecting}>
          Continue
        </Button>
      </div>
    </div>
  )
}
