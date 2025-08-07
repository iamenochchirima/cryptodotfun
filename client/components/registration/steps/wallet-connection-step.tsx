"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setWalletInfo, nextStep } from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { WalletType } from "@/providers/types"
import { useAuth } from "@/providers/auth-context"
import { connectInternetIdentityWallet } from "@/providers/internetidentity"
import { connectNFIDWallet } from "@/providers/nfid"

export default function WalletConnectionStep() {
  const dispatch = useAppDispatch()
  const { login, logout, identity, backendActor, isAuthenticated, sessionData } = useAuth();
  const { walletConnected, walletAddress } = useAppSelector((state) => state.registration)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const walletConnectCallback = (success: boolean, walletType: WalletType) => {
    if (success) {
      login(walletType);
    }
  };


  const connectWallet = async (walletType: string) => {
    setConnecting(true)
    setError(null)

    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock wallet address based on wallet type
      let address = ""
      switch (walletType) {
        case "internet-identity":
          address = "rdmx6-jaaaa-aaaah-qdrya-cai"
          break
        case "ethereum":
          address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
          break
        case "solana":
          address = "5FHwkrdxkRXnQsZC3Qo369ULSBpMJXqYhpJ6GKvdKmr5"
          break
        case "nfid":
          address = "nfid-user-12345-abcdef"
          break
        case "bitcoin":
          address = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
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

      <div className="grid grid-cols-1 gap-4 py-4">
        <Button
          variant="outline"
          className="flex items-center justify-start h-16 px-6 hover:border-primary hover:text-primary bg-transparent"
          onClick={() => connectInternetIdentityWallet(walletConnectCallback)}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mr-4 relative">
            <Image
              src="/placeholder.svg?height=40&width=40&text=II"
              alt="Internet Identity"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg">Internet Identity</span>
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-start h-16 px-6 hover:border-primary hover:text-primary bg-transparent"
          onClick={() => connectWallet("ethereum")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mr-4 relative">
            <Image src="/placeholder.svg?height=40&width=40&text=ETH" alt="Ethereum" fill className="object-contain" />
          </div>
          <span className="text-lg">Sign In with Ethereum</span>
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-start h-16 px-6 hover:border-primary hover:text-primary bg-transparent"
          onClick={() => connectWallet("solana")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mr-4 relative">
            <Image src="/placeholder.svg?height=40&width=40&text=SOL" alt="Solana" fill className="object-contain" />
          </div>
          <span className="text-lg">Sign In With Solana</span>
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-start h-16 px-6 hover:border-primary hover:text-primary bg-transparent"
          onClick={() => connectNFIDWallet(walletConnectCallback)}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mr-4 relative">
            <Image src="/placeholder.svg?height=40&width=40&text=NFID" alt="NFID" fill className="object-contain" />
          </div>
          <span className="text-lg">Sign in with NFID</span>
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-start h-16 px-6 hover:border-primary hover:text-primary bg-transparent"
          onClick={() => connectWallet("bitcoin")}
          disabled={connecting || walletConnected}
        >
          <div className="w-10 h-10 mr-4 relative">
            <Image src="/placeholder.svg?height=40&width=40&text=BTC" alt="Bitcoin" fill className="object-contain" />
          </div>
          <span className="text-lg">Sign In with Bitcoin</span>
        </Button>
      </div>

      {
        walletConnected && (
          <div className="bg-muted p-4 rounded-md flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-green-500" />
            <div>
              <p className="font-medium">Wallet Connected</p>
              <p className="text-sm text-muted-foreground truncate">{walletAddress}</p>
            </div>
          </div>
        )
      }

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!walletConnected || connecting}>
          {connecting ? "Connecting..." : "Continue"}
        </Button>
      </div>
    </div >
  )
}
