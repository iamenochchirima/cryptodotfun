"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supportedChains, getChainsByCategory, type Chain } from "@/types/chains"
import { cn } from "@/lib/utils"

interface ChainSelectorProps {
  selectedChains: string[]
  onChainSelect: (chainIds: string[]) => void
  showCategories?: boolean
  className?: string
}

export function ChainSelector({ 
  selectedChains, 
  onChainSelect, 
  showCategories = true,
  className 
}: ChainSelectorProps) {
  const [open, setOpen] = useState(false)

  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      onChainSelect(selectedChains.filter(id => id !== chainId))
    } else {
      onChainSelect([...selectedChains, chainId])
    }
  }

  const selectAll = () => {
    onChainSelect(supportedChains.map(chain => chain.id))
  }

  const clearAll = () => {
    onChainSelect([])
  }

  const isAllSelected = selectedChains.length === supportedChains.length
  const isNoneSelected = selectedChains.length === 0

  const getSelectedChainsDisplay = () => {
    if (isNoneSelected) return "All Chains"
    if (isAllSelected) return "All Chains"
    if (selectedChains.length === 1) {
      const chain = supportedChains.find(c => c.id === selectedChains[0])
      return chain?.name || "Unknown Chain"
    }
    return `${selectedChains.length} Chains`
  }

  const ChainOption = ({ chain }: { chain: Chain }) => {
    const isSelected = selectedChains.includes(chain.id) || isNoneSelected

    return (
      <div
        onClick={() => toggleChain(chain.id)}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-accent",
          isSelected && !isNoneSelected && "bg-accent border border-primary/20"
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={chain.icon}
              alt={chain.name}
              width={32}
              height={32}
              className="rounded-full"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-logo.svg"
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{chain.name}</span>
            <span className="text-xs text-muted-foreground">{chain.symbol}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: `${chain.color}20`, color: chain.color }}
          >
            {chain.category}
          </Badge>
          {isSelected && !isNoneSelected && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>{getSelectedChainsDisplay()}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-sm">Select Blockchains</h4>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>

          {showCategories ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {/* Layer 1 Chains */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Layer 1
                </h5>
                <div className="space-y-1">
                  {getChainsByCategory('layer1').map((chain) => (
                    <ChainOption key={chain.id} chain={chain} />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Layer 2 Chains */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Layer 2
                </h5>
                <div className="space-y-1">
                  {getChainsByCategory('layer2').map((chain) => (
                    <ChainOption key={chain.id} chain={chain} />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sidechains */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Sidechains
                </h5>
                <div className="space-y-1">
                  {getChainsByCategory('sidechain').map((chain) => (
                    <ChainOption key={chain.id} chain={chain} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {supportedChains.map((chain) => (
                <ChainOption key={chain.id} chain={chain} />
              ))}
            </div>
          )}

          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground text-center">
            {isNoneSelected || isAllSelected 
              ? `Showing NFTs from all ${supportedChains.length} chains`
              : `Showing NFTs from ${selectedChains.length} selected chain${selectedChains.length > 1 ? 's' : ''}`
            }
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}