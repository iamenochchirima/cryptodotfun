"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Wallet } from 'lucide-react'
import Image from "next/image"

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only show the component after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const connectWallet = (type: string) => {
    // Use a deterministic address for demo purposes to avoid hydration issues
    const mockAddress = "0x1234567890abcdef1234567890abcdef12345678"
    setWalletAddress(mockAddress)
    setIsConnected(true)
    setIsOpen(false)
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setIsConnected(false)
  }

  if (!mounted) {
    // Return a placeholder with similar dimensions to avoid layout shift
    return (
      <div className="w-[140px] h-9">
        {/* Placeholder */}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isConnected ? "outline" : "default"}
          className={isConnected ? "border-primary text-primary" : ""}
          onClick={() => isConnected && disconnectWallet()}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnected ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to access personalized features and track your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
            onClick={() => connectWallet("metamask")}
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
          >
            <div className="w-10 h-10 mb-2 relative">
              <Image src="/abstract-crypto-wallet.png" alt="Coinbase" fill className="object-contain" />
            </div>
            <span>Coinbase</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
