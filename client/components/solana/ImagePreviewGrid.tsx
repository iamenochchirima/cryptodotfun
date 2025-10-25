"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Grid3x3, List, Filter } from "lucide-react"

interface NFTImage {
  id: number
  name: string
  imageUrl: string
  metadata?: any
  selected?: boolean
}

interface ImagePreviewGridProps {
  images: NFTImage[]
  onSelectImage?: (id: number) => void
  onSelectAll?: (selected: boolean) => void
}

export function ImagePreviewGrid({
  images,
  onSelectImage,
  onSelectAll,
}: ImagePreviewGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all")

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    // Add more filter logic here based on filterBy
    return matchesSearch
  })

  const selectedCount = images.filter((img) => img.selected).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="unselected">Unselected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selected
            </Badge>
          )}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredImages.length} of {images.length} NFTs
        </span>
        {selectedCount > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={() => onSelectAll?.(false)}
          >
            Clear selection
          </Button>
        )}
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className={`group cursor-pointer transition-all hover:shadow-lg ${
                image.selected ? "ring-2 ring-purple-500" : ""
              }`}
              onClick={() => onSelectImage?.(image.id)}
            >
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img
                  src={image.imageUrl}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {image.selected && (
                  <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{image.name}</p>
                <p className="text-xs text-muted-foreground">#{image.id}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                image.selected ? "ring-2 ring-purple-500" : ""
              }`}
              onClick={() => onSelectImage?.(image.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={image.imageUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{image.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {image.id}</p>
                </div>
                {image.metadata && (
                  <div className="flex gap-2 flex-wrap">
                    {image.metadata.attributes?.slice(0, 3).map((attr: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {attr.trait_type}
                      </Badge>
                    ))}
                  </div>
                )}
                {image.selected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredImages.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No NFTs match your search"
                : "No NFTs uploaded yet"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
