"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Eye, CheckCircle, Info, Rocket, Check, Clock } from "lucide-react"
import { PreviewFilesModal } from "@/components/solana/PreviewFilesModal"
import { saveDraft, loadDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { PaymentModal } from "@/components/nft/PaymentModal"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  imageUrl: string
  supply: string
  mintPrice: string
  royaltyBps: string
}

type SaveStatus = "saving" | "saved" | "idle"

export default function CreateSolanaCollectionPage() {
    const { identity, usersActor} = useAuth()
  const draftId = "solana-draft"
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    supply: "10000",
    mintPrice: "0.1",
    royaltyBps: "500",
  })
  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [nftAssets, setNftAssets] = useState<FileList | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const debouncedFormData = useDebounce(formData, 1000)

  useEffect(() => {
    const autoSave = async () => {
      if (!isLoading && (formData.name || formData.symbol || formData.description)) {
        setSaveStatus("saving")
        try {
          await saveDraft(draftId, formData, collectionImage || undefined, nftAssets || undefined)
          setSaveStatus("saved")
          setLastSaved(Date.now())
        } catch (error) {
          console.error("Failed to save draft:", error)
          setSaveStatus("idle")
        }
      }
    }

    autoSave()
  }, [debouncedFormData, collectionImage, nftAssets, draftId, isLoading])

  useEffect(() => {
    const loadSavedDraft = async () => {
      try {
        const saved = await loadDraft(draftId)
        if (saved) {
          setFormData(saved.formData)

          if (saved.collectionImage) {
            setCollectionImage(saved.collectionImage)
            setFormData(prev => ({...prev, imageUrl: URL.createObjectURL(saved.collectionImage)}))
          }

          if (saved.nftAssets) {
            const dataTransfer = new DataTransfer()
            saved.nftAssets.forEach((file: File) => dataTransfer.items.add(file))
            setNftAssets(dataTransfer.files)
          }

          setLastSaved(saved.lastUpdated)
          setSaveStatus("saved")
        }
      } catch (error) {
        console.error("Failed to load draft:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadSavedDraft()
    }
  }, [])

  useEffect(() => {
    if (identity && usersActor) {
      queryMarketplace()
    }
  }, [usersActor, identity])

  const queryMarketplace = async () => {

    const data = await usersActor?.get_users();
    console.log("Backend users :", data)
    const actor = await  getMarketplaceActor(identity)
    const res = await actor.get_user_collections(0, 0)
    console.log("Market res :", res)
  }

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }, [])

  const steps = [
    { id: 1, title: "Basic Info", description: "Collection details" },
    { id: 2, title: "Assets", description: "Upload artwork & metadata" },
    { id: 3, title: "Review", description: "Verify & deploy" },
  ]

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof CollectionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCollectionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCollectionImage(file)
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, imageUrl }))
    }
  }

  const handleNftAssetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setNftAssets(files)
    }
  }

  const handleDeployClick = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (signature: string) => {
    console.log("Payment successful:", signature)
    setShowPaymentModal(false)
    // TODO: Call backend to upload to Arweave and generate config
  }

  const progress = (currentStep / 3) * 100

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Save Status */}
      {(saveStatus === "saving" || saveStatus === "saved") && (
        <div className="fixed top-20 right-6 z-50 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          {saveStatus === "saving" ? (
            <>
              <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Saving…</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                All changes saved
                {lastSaved && ` • ${formatTime(lastSaved)}`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nft/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NFT Hub
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">
          Create Solana NFT Collection
        </h1>
        <p className="text-lg text-muted-foreground">
          Launch your Solana NFT collection with permanent Arweave storage
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? "bg-purple-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
              {step.id < 3 && (
                <div className="w-12 h-px bg-muted mx-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {steps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nftStandard">NFT Standard *</Label>
                    <Select defaultValue="metaplex">
                      <SelectTrigger>
                        <SelectValue placeholder="Select NFT standard" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metaplex">
                          <div className="flex items-center justify-between w-full">
                            <span>Metaplex Token Metadata</span>
                            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                              Most Common
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="pnft" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Programmable NFTs (pNFTs)</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="cnft" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Compressed NFTs (cNFTs)</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="core" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Core NFTs</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Metaplex Token Metadata is the most widely supported standard across wallets and marketplaces
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Solana Collection"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="MSC"
                        maxLength={10}
                        value={formData.symbol}
                        onChange={(e) =>
                          handleInputChange("symbol", e.target.value.toUpperCase())
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 10 characters
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your NFT collection..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply">Total Supply *</Label>
                      <Input
                        id="supply"
                        type="number"
                        min="1"
                        max="50000"
                        placeholder="10000"
                        value={formData.supply}
                        onChange={(e) =>
                          handleInputChange("supply", e.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 50,000 NFTs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (SOL) *</Label>
                      <Input
                        id="mintPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.1"
                        value={formData.mintPrice}
                        onChange={(e) =>
                          handleInputChange("mintPrice", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="royaltyBps">Royalty Percentage</Label>
                    <Input
                      id="royaltyBps"
                      type="number"
                      min="0"
                      max="1000"
                      placeholder="500"
                      value={formData.royaltyBps}
                      onChange={(e) =>
                        handleInputChange("royaltyBps", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter basis points (500 = 5%, max 10%)
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Solana Collection
                        </div>
                        <div className="text-blue-700 dark:text-blue-200">
                          Your collection will be deployed on Solana with
                          metadata stored permanently on Arweave
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Assets */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Collection Image</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      {collectionImage ? (
                        <div className="space-y-4">
                          <div className="mx-auto w-48 h-48 rounded-lg overflow-hidden">
                            <img
                              src={formData.imageUrl}
                              alt="Collection preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium">{collectionImage.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCollectionImage(null)
                              setFormData((prev) => ({ ...prev, imageUrl: "" }))
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <div className="text-sm text-muted-foreground mb-2">
                            Upload collection logo/banner
                          </div>
                          <input
                            type="file"
                            id="collectionImage"
                            accept="image/png,image/jpeg,image/gif"
                            className="hidden"
                            onChange={handleCollectionImageChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("collectionImage")?.click()}
                          >
                            Choose File
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>NFT Assets</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      {nftAssets && nftAssets.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {nftAssets.length} file{nftAssets.length > 1 ? "s" : ""} selected
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(Array.from(nftAssets).reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB total
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <PreviewFilesModal files={nftAssets} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNftAssets(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <div className="text-sm text-muted-foreground mb-2">
                            Upload your NFT images and metadata
                          </div>
                          <input
                            type="file"
                            id="nftAssets"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleNftAssetsChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("nftAssets")?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Upload a folder with numbered images (0.png, 1.png,
                            etc.)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Arweave Storage
                        </div>
                        <div className="text-purple-700 dark:text-purple-200">
                          All assets will be uploaded to Arweave for permanent,
                          decentralized storage. Estimated cost: ~$5-8 for 1GB
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Rocket className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">
                      Ready to Deploy!
                    </h3>
                    <p className="text-muted-foreground">
                      Review your collection and deploy to Solana
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Collection Summary</h4>
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Symbol:</span>
                        <span className="font-medium">{formData.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supply:</span>
                        <span className="font-medium">{formData.supply}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Mint Price:
                        </span>
                        <span className="font-medium">
                          {formData.mintPrice} SOL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Royalty:</span>
                        <span className="font-medium">
                          {Number(formData.royaltyBps) / 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Deployment Steps</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        <span className="text-sm">Upload to Arweave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        <span className="text-sm">Deploy on Solana</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        <span className="text-sm">Update collection info</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button
                  onClick={handleDeployClick}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Deploy Collection
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Collection"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>

              <div>
                <h3 className="font-semibold">
                  {formData.name || "Collection Name"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.symbol || "SYMBOL"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {formData.description ||
                  "Collection description will appear here..."}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Blockchain:</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                    Solana
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Standard:</span>
                  <span className="text-xs">Metaplex</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Supply:</span>
                  <span>{formData.supply || "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mint Price:</span>
                  <span>{formData.mintPrice || "0"} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Royalty:</span>
                  <span>{Number(formData.royaltyBps) / 100 || "0"}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        collectionName={formData.name || "Your Collection"}
      />
    </div>
  )
}
