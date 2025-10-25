"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Upload } from "lucide-react"

interface CollectionData {
  name: string
  symbol: string
  description: string
  imageUrl?: string
  supply: string
  mintPrice: string
  royaltyBps: string
  blockchain?: string
}

interface CollectionPreviewProps {
  data: CollectionData
  className?: string
}

export function CollectionPreview({ data, className }: CollectionPreviewProps) {
  const royaltyPercentage = Number(data.royaltyBps) / 100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collection Image */}
        <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.name || "Collection"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload className="h-8 w-8 text-white" />
          )}
        </div>

        {/* Collection Name & Symbol */}
        <div>
          <h3 className="font-semibold text-lg">
            {data.name || "Collection Name"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.symbol || "SYMBOL"}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {data.description || "Collection description will appear here..."}
        </p>

        {/* Stats */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Blockchain:</span>
            <Badge
              variant="secondary"
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100"
            >
              {data.blockchain || "Solana"}
            </Badge>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Supply:</span>
            <span className="font-medium">
              {data.supply ? Number(data.supply).toLocaleString() : "0"}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Mint Price:</span>
            <span className="font-medium">
              {data.mintPrice || "0"} {data.blockchain === "Solana" ? "SOL" : "ETH"}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Royalty:</span>
            <span className="font-medium">
              {royaltyPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-muted">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Metadata stored on Arweave</p>
            <p>✓ Permanent & decentralized</p>
            <p>✓ Deployed on Solana</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
