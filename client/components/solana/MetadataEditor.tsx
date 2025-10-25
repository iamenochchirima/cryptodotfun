"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Download, Upload } from "lucide-react"

interface MetadataAttribute {
  trait_type: string
  value: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: MetadataAttribute[]
}

interface MetadataEditorProps {
  tokenId: number
  metadata?: NFTMetadata
  onSave?: (metadata: NFTMetadata) => void
}

export function MetadataEditor({
  tokenId,
  metadata: initialMetadata,
  onSave,
}: MetadataEditorProps) {
  const [metadata, setMetadata] = useState<NFTMetadata>(
    initialMetadata || {
      name: `NFT #${tokenId}`,
      description: "",
      image: "",
      attributes: [],
    }
  )

  const addAttribute = () => {
    setMetadata((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: "", value: "" }],
    }))
  }

  const updateAttribute = (
    index: number,
    field: "trait_type" | "value",
    value: string
  ) => {
    setMetadata((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      ),
    }))
  }

  const removeAttribute = (index: number) => {
    setMetadata((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }))
  }

  const handleSave = () => {
    onSave?.(metadata)
  }

  const exportJSON = () => {
    const json = JSON.stringify(metadata, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tokenId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Metadata Editor - Token #{tokenId}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={metadata.name}
              onChange={(e) =>
                setMetadata((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="NFT Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={metadata.description}
              onChange={(e) =>
                setMetadata((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="NFT Description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URI</Label>
            <Input
              id="image"
              value={metadata.image}
              onChange={(e) =>
                setMetadata((prev) => ({ ...prev, image: e.target.value }))
              }
              placeholder="https://arweave.net/..."
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Image URI will be set after Arweave upload
            </p>
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Attributes ({metadata.attributes.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addAttribute}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          {metadata.attributes.length === 0 ? (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No attributes yet. Click "Add Attribute" to add traits.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metadata.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-end gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Trait Type</Label>
                    <Input
                      value={attr.trait_type}
                      onChange={(e) =>
                        updateAttribute(index, "trait_type", e.target.value)
                      }
                      placeholder="e.g., Background"
                      size="sm"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      placeholder="e.g., Blue"
                      size="sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttribute(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {metadata.attributes.length > 0 && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex flex-wrap gap-2">
              {metadata.attributes.map((attr, index) => (
                <Badge key={index} variant="secondary">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
