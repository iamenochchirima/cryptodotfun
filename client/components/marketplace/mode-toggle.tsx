"use client"

import { useState } from "react"
import { Settings, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type ViewMode = 'simple' | 'advanced'

interface ModeToggleProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  className?: string
}

export function ModeToggle({ mode, onModeChange, className }: ModeToggleProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center space-x-1 bg-muted rounded-lg p-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('simple')}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                mode === 'simple' ? "shadow-sm" : "hover:bg-background"
              )}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Simple</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Simple mode - Essential features only</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'advanced' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('advanced')}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                mode === 'advanced' ? "shadow-sm" : "hover:bg-background"
              )}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Advanced mode - All features and detailed controls</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="pl-2">
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div>
                <Badge variant="outline" className="mb-1">Simple Mode</Badge>
                <p className="text-xs">Clean interface with essential features for browsing and buying NFTs.</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Advanced Mode</Badge>
                <p className="text-xs">Full feature set including detailed analytics, bulk operations, and advanced filtering.</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}