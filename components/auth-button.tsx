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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogIn, LogOut } from "lucide-react"

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userAddress, setUserAddress] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only show the component after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAuth = (type: string) => {
    // Use a deterministic address for demo purposes to avoid hydration issues
    const mockAddress = "0x1234567890abcdef1234567890abcdef12345678"
    setUserAddress(mockAddress)
    setIsLoggedIn(true)
    setIsOpen(false)
  }

  const handleLogout = () => {
    setUserAddress("")
    setIsLoggedIn(false)
    setIsOpen(false)
  }

  if (!mounted) {
    // Return a placeholder with similar dimensions to avoid layout shift
    return <div className="w-[140px] h-9">{/* Placeholder */}</div>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {!isLoggedIn ? (
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-primary text-primary">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src="/crypto-user-avatar.png" alt="User" />
                  <AvatarFallback>CE</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">CryptoExplorer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign up or Login</DialogTitle>
          <DialogDescription>
            Create an account or sign in to access all features of the Crypto Super App.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-center font-medium">Login with your wallet</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("metamask")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/metamask-fox-logo.png" alt="MetaMask" fill className="object-contain" />
                  </div>
                  <span>MetaMask</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("phantom")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/phantom-wallet-logo.png" alt="Phantom" fill className="object-contain" />
                  </div>
                  <span>Phantom</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("walletconnect")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/walletconnect-icon.png" alt="WalletConnect" fill className="object-contain" />
                  </div>
                  <span>WalletConnect</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("coinbase")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/abstract-crypto-wallet.png" alt="Coinbase" fill className="object-contain" />
                  </div>
                  <span>Coinbase</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-center font-medium">Create an account with your wallet</h3>
              <p className="text-sm text-muted-foreground text-center">
                Connect your wallet to create a new account. Your wallet address will be your unique identifier.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("metamask")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/metamask-fox-logo.png" alt="MetaMask" fill className="object-contain" />
                  </div>
                  <span>MetaMask</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("phantom")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/phantom-wallet-logo.png" alt="Phantom" fill className="object-contain" />
                  </div>
                  <span>Phantom</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("walletconnect")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/walletconnect-icon.png" alt="WalletConnect" fill className="object-contain" />
                  </div>
                  <span>WalletConnect</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 hover:border-primary hover:text-primary"
                  onClick={() => handleAuth("coinbase")}
                >
                  <div className="w-10 h-10 mb-2 relative">
                    <Image src="/abstract-crypto-wallet.png" alt="Coinbase" fill className="object-contain" />
                  </div>
                  <span>Coinbase</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
