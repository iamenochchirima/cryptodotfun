"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface CandyMachineInfo {
  address: string
  itemsAvailable: number
  itemsRedeemed: number
  authority: string
  goLiveDate?: string
}

interface CollectionData {
  id: string
  name: string
  symbol: string
  description: string
  image_url: string
  total_supply: bigint
  creator: { toString: () => string }
  chain_data: {
    Solana?: {
      candy_machine_address?: string[]
      collection_mint?: string[]
      manifest_url?: string[]
    }
  }
}

export default function ManageSolanaCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, principal } = useAuth()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<CollectionData | null>(null)
  const [candyMachineInfo, setCandyMachineInfo] = useState<CandyMachineInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadCollectionData()
  }, [isAuthenticated, collectionId])

  const loadCollectionData = async () => {
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor()

      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) {
        throw new Error("Collection not found")
      }

      const collectionData = result[0] as CollectionData

      // Verify user is the creator
      if (collectionData.creator?.toString() !== principal?.toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/collections')
        return
      }

      setCollection(collectionData)

      // TODO: Fetch candy machine info from Solana
      // For now, just use the address from collection data
      const solanaData = collectionData.chain_data.Solana
      if (solanaData?.candy_machine_address?.[0]) {
        setCandyMachineInfo({
          address: solanaData.candy_machine_address[0],
          itemsAvailable: Number(collectionData.total_supply),
          itemsRedeemed: 0,
          authority: "Loading...",
        })
      }
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Collection not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <img
          src={collection.image_url}
          alt={collection.name}
          className="w-32 h-32 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          <p className="text-muted-foreground mb-4">{collection.description}</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{collection.symbol}</Badge>
            <Badge variant="outline">Solana</Badge>
            <Badge variant="default">Active</Badge>
          </div>
        </div>
      </div>

      {/* Candy Machine Info */}
      {candyMachineInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Candy Machine</CardTitle>
            <CardDescription>
              Manage your Solana NFT minting machine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {candyMachineInfo.address}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(candyMachineInfo.address)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(candyMachineInfo.address)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Items Available</label>
                <p className="text-2xl font-bold">{candyMachineInfo.itemsAvailable}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Items Minted</label>
                <p className="text-2xl font-bold">{candyMachineInfo.itemsRedeemed}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Remaining</label>
                <p className="text-2xl font-bold">
                  {candyMachineInfo.itemsAvailable - candyMachineInfo.itemsRedeemed}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="default" disabled>
                Add Items
              </Button>
              <Button variant="outline" disabled>
                Update Settings
              </Button>
              <Button variant="outline" disabled>
                Transfer Authority
              </Button>
              <Button variant="outline" disabled>
                Withdraw Funds
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Management features coming soon...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Collection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Collection ID</label>
            <p className="text-sm font-mono">{collection.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Supply</label>
            <p className="text-sm">{collection.total_supply.toString()}</p>
          </div>
          {collection.chain_data.Solana?.collection_mint?.[0] && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Collection Mint</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {collection.chain_data.Solana.collection_mint[0]}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(collection.chain_data.Solana!.collection_mint![0])}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {collection.chain_data.Solana?.manifest_url?.[0] && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Manifest URL</label>
              <a
                href={collection.chain_data.Solana.manifest_url[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {collection.chain_data.Solana.manifest_url[0]}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
