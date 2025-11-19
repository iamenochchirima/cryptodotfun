"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChainSelector } from "@/components/chain-selector"
import { ModeToggle, type ViewMode } from "@/components/marketplace/mode-toggle"
import { supportedChains, getChainById } from "@/types/chains"
import { cn } from "@/lib/utils"
import { Search, Heart, Plus, TrendingUp, Users, Volume2, Star, ExternalLink, Wallet, Grid3X3, List, SortAsc, Eye } from "lucide-react"

// Enhanced NFT data with multi-chain support
const nfts = [
  {
    id: 1,
    name: "Cosmic Voyager #42",
    creator: "ArtisticMind",
    price: "0.45 ETH",
    priceUSD: 1125,
    image: "/placeholder.svg?height=300&width=300",
    collection: "Cosmic Voyagers",
    chain: "ethereum",
    rarity: "rare",
    verified: true,
    lastSale: "0.42 ETH",
    views: 1240,
    likes: 89,
  },
  {
    id: 2,
    name: "Neon Samurai",
    creator: "CyberArtist",
    price: "2.1 SOL",
    priceUSD: 315,
    image: "/placeholder.svg?height=300&width=300",
    collection: "Neo Tokyo",
    chain: "solana",
    rarity: "epic",
    verified: true,
    lastSale: "1.8 SOL",
    views: 856,
    likes: 124,
  },
  {
    id: 3,
    name: "Abstract Mindscape #7",
    creator: "DreamWeaver",
    price: "0.2 ETH",
    priceUSD: 500,
    image: "/placeholder.svg?height=300&width=300",
    collection: "Mindscapes",
    chain: "ethereum",
    rarity: "common",
    verified: false,
    lastSale: "0.18 ETH",
    views: 432,
    likes: 67,
  },
  {
    id: 4,
    name: "ICP Pioneer #1337",
    creator: "PixelMaster",
    price: "25 ICP",
    priceUSD: 250,
    image: "/placeholder.svg?height=300&width=300",
    collection: "ICP Pioneers",
    chain: "icp",
    rarity: "legendary",
    verified: true,
    lastSale: "22 ICP",
    views: 2100,
    likes: 234,
  },
  {
    id: 5,
    name: "NEAR Constellation",
    creator: "StarGazer",
    price: "50 NEAR",
    priceUSD: 200,
    image: "/placeholder.svg?height=300&width=300",
    collection: "NEAR Worlds",
    chain: "near",
    rarity: "rare",
    verified: true,
    lastSale: "45 NEAR",
    views: 756,
    likes: 92,
  },
  {
    id: 6,
    name: "Polygon Knight",
    creator: "MechCreator",
    price: "150 MATIC",
    priceUSD: 135,
    image: "/placeholder.svg?height=300&width=300",
    collection: "Polygon Warriors",
    chain: "polygon",
    rarity: "uncommon",
    verified: true,
    lastSale: "140 MATIC",
    views: 623,
    likes: 45,
  },
  {
    id: 7,
    name: "Arbitrum Explorer",
    creator: "LayerTwo",
    price: "0.3 ETH",
    priceUSD: 750,
    image: "/placeholder.svg?height=300&width=300",
    collection: "ARB Explorers",
    chain: "arbitrum",
    rarity: "rare",
    verified: false,
    lastSale: "0.25 ETH",
    views: 892,
    likes: 156,
  },
  {
    id: 8,
    name: "Base Builder #42",
    creator: "BaseArtist",
    price: "0.1 ETH",
    priceUSD: 250,
    image: "/placeholder.svg?height=300&width=300",
    collection: "Base Builders",
    chain: "base",
    rarity: "common",
    verified: true,
    lastSale: "0.08 ETH",
    views: 445,
    likes: 78,
  },
]

// Enhanced collections data with multi-chain support
const collections = [
  {
    id: 1,
    name: "Cosmic Voyagers",
    creator: "ArtisticMind",
    items: 100,
    volume: "45.5 ETH",
    volumeUSD: 113750,
    floorPrice: "0.3 ETH",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "ethereum",
    verified: true,
    change24h: 12.5,
    owners: 87,
  },
  {
    id: 2,
    name: "Neo Tokyo",
    creator: "CyberArtist",
    items: 250,
    volume: "520 SOL",
    volumeUSD: 78000,
    floorPrice: "1.2 SOL",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "solana",
    verified: true,
    change24h: -5.2,
    owners: 198,
  },
  {
    id: 3,
    name: "ICP Pioneers",
    creator: "ICPCreator",
    items: 1000,
    volume: "2500 ICP",
    volumeUSD: 25000,
    floorPrice: "15 ICP",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "icp",
    verified: true,
    change24h: 8.7,
    owners: 456,
  },
  {
    id: 4,
    name: "NEAR Worlds",
    creator: "NearArtist",
    items: 500,
    volume: "15000 NEAR",
    volumeUSD: 60000,
    floorPrice: "25 NEAR",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "near",
    verified: false,
    change24h: 15.3,
    owners: 234,
  },
]

export default function NFTHubPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('simple')
  const [selectedChains, setSelectedChains] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('trending')
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid')
  const [priceFilter, setPriceFilter] = useState('all')

  // Filter NFTs based on selected chains and search
  const filteredNFTs = useMemo(() => {
    let filtered = nfts

    // Filter by chains
    if (selectedChains.length > 0) {
      filtered = filtered.filter(nft => selectedChains.includes(nft.chain))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(query) ||
        nft.creator.toLowerCase().includes(query) ||
        nft.collection.toLowerCase().includes(query)
      )
    }

    // Filter by price
    if (priceFilter !== 'all') {
      filtered = filtered.filter(nft => {
        if (priceFilter === 'low') return nft.priceUSD < 100
        if (priceFilter === 'medium') return nft.priceUSD >= 100 && nft.priceUSD <= 500
        if (priceFilter === 'high') return nft.priceUSD > 500
        return true
      })
    }

    return filtered
  }, [selectedChains, searchQuery, priceFilter])

  const filteredCollections = useMemo(() => {
    let filtered = collections

    if (selectedChains.length > 0) {
      filtered = filtered.filter(collection => selectedChains.includes(collection.chain))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(collection => 
        collection.name.toLowerCase().includes(query) ||
        collection.creator.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [selectedChains, searchQuery])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'uncommon': return 'bg-green-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Multi-Chain NFT Marketplace
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover, collect, and trade NFTs across {supportedChains.length}+ blockchains
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle mode={viewMode} onModeChange={setViewMode} />
            <Button variant="outline" asChild>
              <Link href="/collections/my">
                <Wallet className="mr-2 h-4 w-4" />
                My Collections
              </Link>
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" asChild>
              <Link href="/nft/create-collection">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Collection */}
      <div className="mb-8 rounded-xl overflow-hidden border bg-gradient-to-r from-primary/10 to-purple-600/10">
        <div className="relative h-48 md:h-64">
          <Image src="/placeholder.svg?height=600&width=1200" alt="Featured Collection" fill className="object-cover rounded-t-xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end gap-4">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-background">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Collection Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">Multi-Chain Genesis</h2>
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                </div>
                <p className="text-white/80 text-sm">By CryptoArt Studios • Floor: 0.5 ETH</p>
              </div>
              <Button size="sm" variant="secondary" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      </div>


        {/* Chain Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-bold">$2.4M</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-xl font-bold">12.4K</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Collections</p>
                <p className="text-xl font-bold">1,250</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chains</p>
                <p className="text-xl font-bold">{supportedChains.length}</p>
              </div>
            </div>
          </Card>
        </div>

      {/* Advanced Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search NFTs, collections, creators, or traits..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Chain Selector */}
          <ChainSelector
            selectedChains={selectedChains}
            onChainSelect={(chains: string[]) => setSelectedChains(chains)}
            className="min-w-[200px]"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under $100</SelectItem>
              <SelectItem value="medium">$100 - $500</SelectItem>
              <SelectItem value="high">Over $500</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Recently Listed</SelectItem>
              <SelectItem value="oldest">Oldest Listed</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'advanced' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}
              >
                {layoutMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-1" />
                Bulk Actions
              </Button>
            </>
          )}

          <div className="flex-1" />
          
          <div className="text-sm text-muted-foreground">
            {filteredNFTs.length} NFTs • {filteredCollections.length} Collections
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trending" className="mb-8">
        <TabsList>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="collections">Top Collections</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="art">Art</TabsTrigger>
          <TabsTrigger value="collectibles">Collectibles</TabsTrigger>
        </TabsList>

        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-6">
          <div className={cn(
            layoutMode === 'grid' 
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
              : "space-y-4"
          )}>
            {filteredNFTs.map((nft) => {
              const chain = getChainById(nft.chain)
              
              if (layoutMode === 'list' && viewMode === 'advanced') {
                return (
                  <Card key={nft.id} className="p-4 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={nft.image || "/placeholder.svg"}
                          alt={nft.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                          {nft.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{nft.collection} • by {nft.creator}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{nft.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{nft.likes}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">{nft.price}</p>
                          <p className="text-sm text-muted-foreground">${nft.priceUSD}</p>
                        </div>
                        {chain && (
                          <div className="flex items-center space-x-2">
                            <Image src={chain.icon} alt={chain.name} width={20} height={20} className="rounded-full" />
                          </div>
                        )}
                        <Button size="sm">
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              }
              
              return (
                <Card
                  key={nft.id}
                  className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] duration-200"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      {viewMode === 'advanced' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center space-x-1">
                      {chain && (
                        <div className="flex items-center space-x-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                          <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                          <span className="text-xs font-medium">{chain.symbol}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge className={cn("text-xs", getRarityColor(nft.rarity))}>
                        {nft.rarity}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground truncate">{nft.collection}</span>
                        {nft.verified && <Badge variant="outline" className="text-xs">✓</Badge>}
                      </div>
                      <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm truncate">
                        <span className="text-muted-foreground">by </span>
                        <span className="font-medium">{nft.creator}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{nft.price}</div>
                        <div className="text-xs text-muted-foreground">${nft.priceUSD}</div>
                      </div>
                    </div>
                    
                    {viewMode === 'advanced' && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center space-x-2">
                          <span>👁 {nft.views}</span>
                          <span>❤️ {nft.likes}</span>
                        </div>
                        <span>Last: {nft.lastSale}</span>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Button className="w-full" size={viewMode === 'simple' ? 'default' : 'sm'} asChild>
                        <Link href={`/nft/marketplace/${nft.id}`}>Buy Now</Link>
                      </Button>
                      {viewMode === 'advanced' && (
                        <Button variant="outline" className="w-full" size="sm">
                          Make Offer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No NFTs found</div>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCollections.map((collection) => {
              const chain = getChainById(collection.chain)
              
              return (
                <Card
                  key={collection.id}
                  className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] duration-200"
                >
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={collection.banner || "/placeholder.svg"}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {chain && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                          <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                          <span className="text-xs font-medium">{chain.symbol}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-xl border-4 border-background flex-shrink-0">
                        <Image
                          src={collection.image || "/placeholder.svg"}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold truncate">{collection.name}</h3>
                          {collection.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">by {collection.creator}</p>
                        {viewMode === 'advanced' && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">{collection.owners} owners</span>
                            <span className={cn(
                              "text-xs font-medium",
                              collection.change24h > 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {collection.change24h > 0 ? '+' : ''}{collection.change24h.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Items</div>
                        <div className="font-medium text-sm">{collection.items.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                        <div className="font-medium text-sm">{collection.volume}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Floor</div>
                        <div className="font-medium text-sm">{collection.floorPrice}</div>
                      </div>
                    </div>
                    
                    {viewMode === 'advanced' && (
                      <div className="text-center mb-3">
                        <div className="text-xs text-muted-foreground">Total Volume (USD)</div>
                        <div className="font-bold">${collection.volumeUSD.toLocaleString()}</div>
                      </div>
                    )}
                    
                    <Button className="w-full" size={viewMode === 'simple' ? 'default' : 'sm'} asChild>
                      <Link href={`/nft/collections/${collection.id}`}>View Collection</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {filteredCollections.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No collections found</div>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </TabsContent>

        {/* New Tab */}
        <TabsContent value="new" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts
              .slice(4, 8)
              .concat(nfts.slice(0, 4))
              .map((nft) => (
                <div
                  key={nft.id}
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="rounded-full bg-background/50 px-2 py-1 text-xs backdrop-blur-sm">
                        {nft.chain}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-1 text-sm text-muted-foreground">{nft.collection}</div>
                    <h3 className="mb-2 text-lg font-bold">{nft.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">By </span>
                        <span className="font-medium">{nft.creator}</span>
                      </div>
                      <div className="font-bold">{nft.price}</div>
                    </div>
                  </div>
                  <div className="border-t p-4">
                    <Button className="w-full" asChild>
                      <Link href={`/nft/marketplace/${nft.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Art Tab */}
        <TabsContent value="art" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts
              .filter(
                (nft) =>
                  nft.collection.includes("Art") ||
                  nft.collection.includes("Abstract") ||
                  nft.collection.includes("Digital"),
              )
              .map((nft) => (
                <div
                  key={nft.id}
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="rounded-full bg-background/50 px-2 py-1 text-xs backdrop-blur-sm">
                        {nft.chain}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-1 text-sm text-muted-foreground">{nft.collection}</div>
                    <h3 className="mb-2 text-lg font-bold">{nft.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">By </span>
                        <span className="font-medium">{nft.creator}</span>
                      </div>
                      <div className="font-bold">{nft.price}</div>
                    </div>
                  </div>
                  <div className="border-t p-4">
                    <Button className="w-full" asChild>
                      <Link href={`/nft/marketplace/${nft.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Collectibles Tab */}
        <TabsContent value="collectibles" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts
              .filter(
                (nft) =>
                  nft.collection.includes("Punk") ||
                  nft.collection.includes("Voyager") ||
                  nft.collection.includes("Warrior"),
              )
              .map((nft) => (
                <div
                  key={nft.id}
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="rounded-full bg-background/50 px-2 py-1 text-xs backdrop-blur-sm">
                        {nft.chain}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-1 text-sm text-muted-foreground">{nft.collection}</div>
                    <h3 className="mb-2 text-lg font-bold">{nft.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">By </span>
                        <span className="font-medium">{nft.creator}</span>
                      </div>
                      <div className="font-bold">{nft.price}</div>
                    </div>
                  </div>
                  <div className="border-t p-4">
                    <Button className="w-full" asChild>
                      <Link href={`/nft/marketplace/${nft.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create and Sell CTA */}
      <div className="mt-16 rounded-xl bg-gradient-to-r from-primary/10 via-purple-600/10 to-pink-600/10 border p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Launch Your Multi-Chain Collection
            </h2>
            <p className="mb-6 text-muted-foreground">
              Create and deploy NFT collections across {supportedChains.length}+ blockchains. 
              Choose your preferred chain, set royalties, and launch with professional tools.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {supportedChains.slice(0, 6).map((chain) => (
                <div key={chain.id} className="flex items-center space-x-1 bg-background/50 rounded-full px-3 py-1">
                  <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                  <span className="text-xs font-medium">{chain.symbol}</span>
                </div>
              ))}
              <div className="flex items-center space-x-1 bg-background/50 rounded-full px-3 py-1">
                <span className="text-xs font-medium">+{supportedChains.length - 6} more</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" asChild>
                <Link href="/nft/create-collection">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Collection
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/nft/create">
                  <Wallet className="mr-2 h-4 w-4" />
                  Mint Single NFT
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 rounded-lg overflow-hidden border">
            <Image src="/placeholder.svg?height=400&width=600" alt="Create NFTs" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Multi-Chain Support</span>
                <Badge className="bg-primary text-primary-foreground">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
