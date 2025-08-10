"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import WalletConnectionModal from "@/components/wallet-connection-modal"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      setShowModal(true)
      router.push("/")
    }
  }, [isAuthenticated, router, mounted])

  if (!mounted) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <>
        <WalletConnectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    )
  }

  return <>{children}</>
}