"use client"

import { useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (signature: string) => void
  collectionName: string
}

const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || ""
const LAUNCH_FEE_SOL = 0.1

export function PaymentModal({ open, onClose, onSuccess, collectionName }: PaymentModalProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePayment = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError(null)

    console.log({PLATFORM_WALLET})

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PLATFORM_WALLET),
          lamports: LAUNCH_FEE_SOL * LAMPORTS_PER_SOL,
        })
      )

      console.log({transaction})

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext()

      const signature = await sendTransaction(transaction, connection, { minContextSlot })

      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature })

      setSuccess(true)
      setTimeout(() => {
        onSuccess(signature)
      }, 1500)
    } catch (err: any) {
      console.error("Payment failed:", err)
      setError(err.message || "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Launch Your Collection</DialogTitle>
          <DialogDescription>
            Pay the launch fee to deploy &quot;{collectionName}&quot; on Solana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fee Breakdown */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Launch Fee</span>
              <span className="text-lg font-semibold">{LAUNCH_FEE_SOL} SOL</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Permanent Arweave storage</span>
              </div>
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Candy Machine config generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Platform hosting & support</span>
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!publicKey ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Connect your Solana wallet to continue
              </p>
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm">Wallet Connected</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Payment successful! Processing...</span>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={loading || success}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Payment Confirmed
                  </>
                ) : (
                  `Pay ${LAUNCH_FEE_SOL} SOL`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Network: Solana Devnet • Fee: {LAUNCH_FEE_SOL} SOL
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
