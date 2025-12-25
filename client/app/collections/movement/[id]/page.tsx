"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Share2,
  Heart,
  MoreHorizontal,
  Loader2
} from "lucide-react"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { getCollectionAddress } from "@/lib/movement/collection"
import { getCollectionByAddress, getNFTsByCollection } from "@/lib/movement/graphql"
import type { Collection as CanisterCollection } from "@/declarations/marketplace/marketplace.did"
import { toast } from "sonner"
import { useWalletConnection } from "@/connect-wallet"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { getModuleId, MOVEMENT_NETWORK } from "@/constants/movement"
import ListingModal from "./components/listing-modal"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"

export default function MovementCollectionPage() {
  const params = useParams()
  const collectionId = params?.id as string
  const { walletState } = useWalletConnection()
  const { signAndSubmitTransaction } = useWallet()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isLoading, setIsLoading] = useState(true)
  const [collection, setCollection] = useState<CanisterCollection | null>(null)
  const [collectionAddress, setCollectionAddress] = useState<string>("")
  const [onChainData, setOnChainData] = useState<any>(null)
  const [nfts, setNfts] = useState<any[]>([])
  const [nftMetadata, setNftMetadata] = useState<Map<string, any>>(new Map())
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)

  useEffect(() => {
    if (collectionId) {
      loadCollectionData()
    }
  }, [collectionId])

  const loadCollectionData = async () => {
    try {
      setIsLoading(true)

      const actor = await getMarketplaceActor(null)
      const result = await actor.get_collection(collectionId)

      if (!result || result.length === 0) {
        toast.error("Collection not found")
        return
      }

      const collectionData = result[0]
      setCollection(collectionData)

      const movementData = 'Movement' in collectionData.chain_data
        ? collectionData.chain_data.Movement
        : null

      if (!movementData) {
        toast.error("This is not a Movement collection")
        return
      }

      const collectionAddr = movementData.collection_address?.[0]

      if (collectionAddr) {
        setCollectionAddress(collectionAddr)
        await fetchOnChainData(collectionAddr)
        await fetchNFTs(collectionAddr)
      } else {
        const creatorAddr = movementData.collection_created
          ? collectionData.creator.toText()
          : null

        if (creatorAddr) {
          try {
            const addr = await getCollectionAddress(
              creatorAddr,
              collectionData.name,
              "testnet"
            )
            setCollectionAddress(addr)
            await fetchOnChainData(addr)
            await fetchNFTs(addr)
          } catch (error) {
            console.error("Failed to get collection address:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOnChainData = async (address: string) => {
    try {
      const data = await getCollectionByAddress(address, "testnet")
      setOnChainData(data)
    } catch (error) {
      console.error("Failed to fetch on-chain data:", error)
    }
  }

  const fetchNFTs = async (address: string) => {
    try {
      const nftData = await getNFTsByCollection(address, "testnet")
      setNfts(nftData)

      nftData.forEach((nft: any) => {
        fetchNFTMetadata(nft)
      })
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
    }
  }

  const fetchNFTMetadata = async (nft: any) => {
    const uri = nft.current_token_data?.token_uri
    if (!uri) return

    try {
      const response = await fetch(uri)
      if (response.ok) {
        const metadata = await response.json()
        setNftMetadata(prev => new Map(prev).set(nft.token_data_id, metadata))
      }
    } catch (error) {
      console.error("Failed to fetch NFT metadata:", error)
    }
  }

  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft)
    setIsListingModalOpen(true)
  }

  const handleListSubmit = async (price: string, duration: string) => {
    if (!selectedNFT || !walletState.address || !signAndSubmitTransaction) return

    try {
      toast.info("Listing NFT on Movement...")

      const priceInOctas = Math.floor(parseFloat(price) * 100000000)

      const transaction = {
        data: {
          function: `${getModuleId("marketplace", "testnet")}::list_with_fixed_price`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            selectedNFT.token_data_id,
            priceInOctas.toString()
          ],
        },
      }

      // Submit transaction and get response
      const response = await signAndSubmitTransaction(transaction)

      console.log("=== NFT Listing Transaction ===")
      console.log("Transaction Hash:", response.hash)
      console.log("NFT Token ID:", selectedNFT.token_data_id)
      console.log("Price (MOVE):", price)
      console.log("Price (Octas):", priceInOctas)
      console.log("Duration (days):", duration)

      // Wait for transaction confirmation
      toast.info("Transaction submitted. Waiting for confirmation...")

      // Initialize Aptos client
      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: MOVEMENT_NETWORK.testnet.rpcUrl,
      })
      const aptos = new Aptos(aptosConfig)

      // Try to wait for transaction confirmation
      try {
        const txResult = await aptos.waitForTransaction({
          transactionHash: response.hash,
        })
        console.log("Transaction confirmed:", txResult)
        console.log("Transaction success:", txResult.success)
      } catch (waitError) {
        console.warn("Could not wait for transaction confirmation:", waitError)
        console.log("Transaction was submitted with hash:", response.hash)
        // Continue anyway - the transaction was submitted successfully
      }

      // Show success toast with transaction link
      toast.success(
        <div className="flex flex-col gap-2">
          <p>NFT listed successfully!</p>
          <p className="text-sm">{selectedNFT.current_token_data?.token_name || "NFT"} • {price} MOVE</p>
          <a
            href={`https://explorer.movementnetwork.xyz/txn/${response.hash}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:no-underline"
          >
            View on Explorer →
          </a>
        </div>,
        {
          duration: 10000,
        }
      )

      console.log("=== Listing Complete ===")
    } catch (error) {
      console.error("Failed to list NFT:", error)
      toast.error("Failed to list NFT")
      throw error
    }
  }

  const filteredNFTs = useMemo(() => {
    let filtered = nfts

    if (statusFilter === "owned") {
      if (walletState.isConnected && walletState.chain === "movement" && walletState.address) {
        filtered = filtered.filter(nft =>
          nft.owner_address?.toLowerCase() === walletState.address?.toLowerCase()
        )
      } else {
        filtered = []
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft =>
        nft.current_token_data?.token_name?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [nfts, searchQuery, statusFilter, walletState.isConnected, walletState.chain, walletState.address])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
          <p className="text-muted-foreground mb-6">The collection you're looking for doesn't exist</p>
          <Button asChild>
            <Link href="/collections">Back to Collections</Link>
          </Button>
        </div>
      </div>
    )
  }

  const floorPrice = onChainData?.current_supply ? "0.00 MOVE" : "0.00 MOVE"
  const totalVolume = onChainData?.total_minted_v2 || 0
  const items = onChainData?.current_supply || Number(collection.total_supply)
  const maxSupply = onChainData?.max_supply || Number(collection.total_supply)
  const uniqueOwners = new Set(nfts.map(nft => nft.owner_address)).size

  return (
    <div className="container mx-auto px-4 py-24">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/collections">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Link>
      </Button>

      {/* Collection Banner */}
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={collection.banner_url?.[0] || collection.image_url}
            alt={collection.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              <Image
                src={collection.image_url}
                alt={collection.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                    <Badge variant="secondary" className="text-sm">✓ Verified</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    by <Link href={`/profile/${collection.creator.toText()}`} className="hover:underline font-medium">{collection.creator.toText().substring(0, 8)}...</Link>
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">Movement</Badge>
                    <span className="text-sm text-muted-foreground">{(Number(collection.royalty_bps) / 100).toFixed(1)}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Floor Price</div>
          <div className="text-2xl font-bold">{floorPrice}</div>
          <div className="text-xs text-muted-foreground">$0.00</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Minted</div>
          <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">NFTs</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{items.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{maxSupply ? `/ ${maxSupply.toLocaleString()}` : 'supply'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Owners</div>
          <div className="text-2xl font-bold">{uniqueOwners.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{items > 0 ? Math.round((uniqueOwners / items) * 100) : 0}% unique</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Listed</div>
          <div className="text-2xl font-bold">{Number(collection.listed_count).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">for sale</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="mb-8">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or traits..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="unlisted">Not Listed</SelectItem>
                  <SelectItem value="owned">Owned by Me</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                  <SelectItem value="newest">Recently Listed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredNFTs.length} items
            </div>
          </div>

          {/* NFT Grid */}
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "space-y-4"
          )}>
            {filteredNFTs.map((nft) => {
              const metadata = nftMetadata.get(nft.token_data_id)
              const tokenName = nft.current_token_data?.token_name || "Unnamed NFT"
              const imageUrl = metadata?.image || metadata?.image_url || "/placeholder.svg?height=300&width=300"
              const traits = metadata?.attributes?.length || 0

              const isOwnedByUser = walletState.isConnected &&
                walletState.chain === "movement" &&
                walletState.address &&
                nft.owner_address?.toLowerCase() === walletState.address.toLowerCase()

              return (
                <Card key={nft.token_data_id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={tokenName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    {isOwnedByUser && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="text-xs">Owned</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg truncate">{tokenName}</h3>
                      <p className="text-sm text-muted-foreground">{traits} traits</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Owner</div>
                        <div className="text-xs font-mono">
                          {nft.owner_address.substring(0, 6)}...{nft.owner_address.substring(nft.owner_address.length - 4)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Amount</div>
                        <div className="text-sm">{nft.amount}</div>
                      </div>
                    </div>

                    {isOwnedByUser ? (
                      <Button className="w-full" size="sm" onClick={() => handleListNFT(nft)}>
                        List for Sale
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No items found</div>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Activity Coming Soon</div>
            <p className="text-sm text-muted-foreground">View collection trading history and events</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Analytics Coming Soon</div>
            <p className="text-sm text-muted-foreground">View price charts, holder distribution, and more</p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedNFT && (
        <ListingModal
          isOpen={isListingModalOpen}
          onClose={() => {
            setIsListingModalOpen(false)
            setSelectedNFT(null)
          }}
          nft={{
            name: selectedNFT.current_token_data?.token_name || "Unnamed NFT",
            image: nftMetadata.get(selectedNFT.token_data_id)?.image || "/placeholder.svg",
            collection: collection?.name || "Collection"
          }}
          onList={handleListSubmit}
        />
      )}
    </div>
  )
}
