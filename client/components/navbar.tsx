"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Search, X, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import AuthButton from "@/components/auth-button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/providers/auth-context"
import { useWalletConnection, WalletModal } from "@/connect-wallet"
import WalletInfoModal from "@/components/wallet-info-modal"

// Simplified navigation links
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
  { name: "Blog", href: "/blog" },
  { name: "Pulse", href: "/pulse" },
]

export default function Navbar() {
  const { isAuthenticated, fetchingUser } = useAuth();
  const { walletState, disconnectWallet } = useWalletConnection();
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)
  const pathname = usePathname()

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      // Open wallet info modal to show details and disconnect option
      setWalletInfoModalOpen(true);
    } else {
      // Open modal to connect
      setWalletModalOpen(true);
    }
  }

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return <header className="fixed top-0 z-50 w-full h-16" />
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="CryptoDotFun Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-xl font-bold crypto-gradient-text">CryptoDotFun</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <AuthButton />

          {/* New Standalone Wallet Connection Button - Only shown after authentication */}
          {isAuthenticated && (
            <>
              {walletState.isConnected ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWalletButtonClick}
                  className="hidden md:flex"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="sr-only">Wallet Info</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleWalletButtonClick}
                  className="hidden md:flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </>
          )}

          {isAuthenticated && <NotificationDropdown />}

          <ModeToggle />

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {/* Connect Wallet Button - Only shown after authentication */}
              {isAuthenticated && (
                <>
                  {walletState.isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWalletInfoModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet Info
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setWalletModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      {/* Wallet Info Modal */}
      <WalletInfoModal
        isOpen={walletInfoModalOpen}
        onClose={() => setWalletInfoModalOpen(false)}
      />
    </header>
  )
}
