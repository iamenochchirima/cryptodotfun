import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, LayoutGrid, Heart, Filter, ArrowRight, Plus } from "lucide-react"

// Mock NFT data
const nfts = [
  {
    id: 1,
    name: "Cosmic Voyager #42",
    creator: "ArtisticMind",
    price: "0.45 ETH",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Cosmic Voyagers",
    chain: "Ethereum",
  },
  {
    id: 2,
    name: "Neon Samurai",
    creator: "CyberArtist",
    price: "2.1 SOL",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Neo Tokyo",
    chain: "Solana",
  },
  {
    id: 3,
    name: "Abstract Mindscape #7",
    creator: "DreamWeaver",
    price: "0.2 ETH",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Mindscapes",
    chain: "Ethereum",
  },
  {
    id: 4,
    name: "Pixel Punk #1337",
    creator: "PixelMaster",
    price: "0.8 ETH",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Pixel Punks",
    chain: "Ethereum",
  },
  {
    id: 5,
    name: "Ethereal Landscape",
    creator: "NatureMinter",
    price: "1.5 SOL",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Ethereal Worlds",
    chain: "Solana",
  },
  {
    id: 6,
    name: "Golden Mech Warrior",
    creator: "MechCreator",
    price: "0.35 ETH",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Mech Warriors",
    chain: "Ethereum",
  },
  {
    id: 7,
    name: "Mystic Owl #13",
    creator: "NightOwl",
    price: "0.6 ETH",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Mystic Creatures",
    chain: "Ethereum",
  },
  {
    id: 8,
    name: "Digital Dreamscape",
    creator: "VirtualArtist",
    price: "3.2 SOL",
    image: "/placeholder.svg?height=300&width=300",
    collection: "Digital Dreams",
    chain: "Solana",
  },
]

// Mock collections data
const collections = [
  {
    id: 1,
    name: "Cosmic Voyagers",
    creator: "ArtisticMind",
    items: 100,
    volume: "45.5 ETH",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "Ethereum",
  },
  {
    id: 2,
    name: "Neo Tokyo",
    creator: "CyberArtist",
    items: 250,
    volume: "520 SOL",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "Solana",
  },
  {
    id: 3,
    name: "Mindscapes",
    creator: "DreamWeaver",
    items: 75,
    volume: "12.8 ETH",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "Ethereum",
  },
  {
    id: 4,
    name: "Pixel Punks",
    creator: "PixelMaster",
    items: 10000,
    volume: "8500 ETH",
    image: "/placeholder.svg?height=300&width=300",
    banner: "/placeholder.svg?height=600&width=1200",
    chain: "Ethereum",
  },
]

export default function NFTHubPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">NFT Hub</h1>
        <p className="text-lg text-muted-foreground">
          Discover, collect, create, and launch extraordinary NFTs across multiple blockchains.
        </p>
      </div>

      {/* Featured Collection */}
      <div className="mb-8 rounded-xl overflow-hidden">
        <div className="relative h-64 md:h-80">
          <Image src="/placeholder.svg?height=600&width=1200" alt="Featured Collection" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-end gap-4">
              <div className="relative h-24 w-24 rounded-xl overflow-hidden border-4 border-background">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Collection Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Featured Collection</h2>
                <p className="text-white/80">By CryptoCreator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Collection CTA */}
      <div className="mb-12 flex justify-center">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
          <Link href="/nft/create-collection">
            <Plus className="mr-2 h-4 w-4" />
            Create Your Own Collection
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search NFTs, collections, or creators..." className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Blockchain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chains</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under 0.1 ETH</SelectItem>
              <SelectItem value="medium">0.1 - 1 ETH</SelectItem>
              <SelectItem value="high">Over 1 ETH</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <LayoutGrid className="h-4 w-4" />
          </Button>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts.map((nft) => (
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
                    <div className="rounded-full bg-background/50 px-2 py-1 text-xs backdrop-blur-sm">{nft.chain}</div>
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

        {/* Collections Tab */}
        <TabsContent value="collections" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={collection.banner || "/placeholder.svg"}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative -mt-12 h-20 w-20 overflow-hidden rounded-xl border-4 border-background">
                      <Image
                        src={collection.image || "/placeholder.svg"}
                        alt={collection.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-xl font-bold">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground">By {collection.creator}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Items</div>
                      <div className="font-medium">{collection.items}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="font-medium">{collection.volume}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link href={`/nft/collections/${collection.id}`}>View Collection</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      <div className="mt-16 rounded-xl bg-gradient-to-r from-crypto-purple/20 to-crypto-pink/20 p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Create and Launch Your NFTs</h2>
            <p className="mb-6 text-muted-foreground">
              Launch your own NFT collection with our easy-to-use tools. No coding required. Set royalties, properties,
              and more with just a few clicks.
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="/nft/create-collection">
                Create Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative h-64 rounded-lg overflow-hidden">
            <Image src="/placeholder.svg?height=400&width=600" alt="Create NFTs" fill className="object-cover" />
          </div>
        </div>
      </div>
    </div>
  )
}
