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
import { Collection } from "@/declarations/marketplace/marketplace.did"

export default function ManageSolanaCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !collectionId || !identity) {
      return
    }

    loadCollectionData()
  }, [isAuthenticated, collectionId, identity])

  const loadCollectionData = async () => {
    if (!identity) {
      return
    }
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor(identity)

      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) {
        throw new Error("Collection not found")
      }

      const collectionData = result[0]

      if (collectionData.creator.toString() !== identity.getPrincipal().toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/collections')
        return
      }

      setCollection(collectionData)
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

  const solanaData = 'Solana' in collection.chain_data ? collection.chain_data.Solana : null
  const candyMachineAddress = solanaData?.candy_machine_address?.[0] || null
  const candyMachineAuthority = solanaData?.candy_machine_authority?.[0] || null
  const collectionMint = solanaData?.collection_mint?.[0] || null

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
      {candyMachineAddress && (
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
                  {candyMachineAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(candyMachineAddress)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(candyMachineAddress)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Config Info */}
            {solanaData?.candy_machine_config?.[0] && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Items Available</label>
                  <p className="text-2xl font-bold">
                    {solanaData.candy_machine_config[0].items_available.toString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price (lamports)</label>
                  <p className="text-2xl font-bold">
                    {solanaData.candy_machine_config[0].price.toString()}
                  </p>
                </div>
              </div>
            )}

            {/* Authority */}
            {candyMachineAuthority && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Authority</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {candyMachineAuthority}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInExplorer(candyMachineAuthority)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

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
          {collectionMint && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Collection Mint</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {collectionMint}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(collectionMint)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {solanaData?.manifest_url?.[0] && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Manifest URL</label>
              <a
                href={solanaData.manifest_url[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {solanaData.manifest_url[0]}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
