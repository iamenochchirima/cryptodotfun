"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileImage, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  file: File
  preview: string
  status: "pending" | "uploading" | "success" | "error"
  metadata?: any
}

interface AssetUploaderProps {
  maxFiles?: number
  onUploadComplete?: (files: UploadedFile[]) => void
}

export function AssetUploader({
  maxFiles = 10000,
  onUploadComplete,
}: AssetUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = []

      Array.from(fileList).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) {
          return
        }

        if (file.type.startsWith("image/")) {
          const preview = URL.createObjectURL(file)
          newFiles.push({
            file,
            preview,
            status: "pending",
          })
        }
      })

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = e.dataTransfer.files
      processFiles(droppedFiles)
    },
    [processFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files)
      }
    },
    [processFiles]
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const clearAll = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
    setUploadProgress(0)
  }, [files])

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          isDragging
            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
            : "border-muted-foreground/25"
        )}
      >
        <Upload
          className={cn(
            "mx-auto h-12 w-12 mb-4",
            isDragging ? "text-purple-600" : "text-muted-foreground"
          )}
        />
        <div className="text-sm text-muted-foreground mb-4">
          <p className="font-medium mb-1">
            Drag and drop your NFT images here, or click to browse
          </p>
          <p className="text-xs">
            Supported formats: PNG, JPG, GIF, SVG (Max {maxFiles} files)
          </p>
        </div>
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button variant="outline" size="sm" asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            Choose Files
          </label>
        </Button>
      </div>

      {/* Upload Stats */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  {files.filter((f) => f.status === "success").length} uploaded
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-lg overflow-hidden border border-muted"
            >
              <img
                src={file.preview}
                alt={file.file.name}
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                {file.status === "success" && (
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                {file.status === "error" && (
                  <div className="bg-red-500 rounded-full p-1">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                {file.status === "uploading" && (
                  <div className="bg-blue-500 rounded-full p-1 animate-pulse">
                    <div className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>

              {/* File Name */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">
                  {file.file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No files uploaded yet
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
