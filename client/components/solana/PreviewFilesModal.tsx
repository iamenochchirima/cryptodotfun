"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, FileImage, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PreviewFilesModalProps {
  files: FileList | null
}

export function PreviewFilesModal({ files }: PreviewFilesModalProps) {
  const [open, setOpen] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({})

  if (!files || files.length === 0) {
    return null
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      const urls: { [key: string]: string } = {}
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          urls[file.name] = URL.createObjectURL(file)
        }
      })
      setPreviewUrls(urls)
    } else {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
      setPreviewUrls({})
    }
  }

  const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>NFT Assets Preview</DialogTitle>
          <DialogDescription>
            {files.length} file{files.length > 1 ? "s" : ""} selected • {(totalSize / 1024 / 1024).toFixed(2)} MB total
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from(files).map((file, index) => (
              <div key={`${file.name}-${index}`} className="space-y-2">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-muted-foreground/10">
                  {previewUrls[file.name] ? (
                    <img
                      src={previewUrls[file.name]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                    {file.type && (
                      <Badge variant="outline" className="text-xs">
                        {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
