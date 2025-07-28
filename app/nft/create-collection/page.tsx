"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, Eye, Wallet, CheckCircle, AlertCircle, Info, Rocket } from "lucide-react"

export default function CreateCollectionPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    blockchain: "",
    supply: "",
    mintPrice: "",
    royalty: "",
    publicMint: true,
    whitelistMint: false,
  })

  const steps = [
    { id: 1, title: "Basic Info", description: "Collection details" },
    { id: 2, title: "Design", description: "Upload artwork" },
    { id: 3, title: "Settings", description: "Configure minting" },
    { id: 4, title: "Launch", description: "Deploy collection" },
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const progress = (currentStep / 4) * 100

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nft/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NFT Hub
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">Create NFT Collection</h1>
        <p className="text-lg text-muted-foreground">
          Launch your own NFT collection with our easy-to-use creation tools.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {step.id < 4 && <div className="w-12 h-px bg-muted mx-4 hidden sm:block" />}
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
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Awesome Collection"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="MAC"
                        value={formData.symbol}
                        onChange={(e) => handleInputChange("symbol", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your NFT collection..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blockchain">Blockchain *</Label>
                    <Select
                      value={formData.blockchain}
                      onValueChange={(value) => handleInputChange("blockchain", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Design */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Collection Logo</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <div className="text-sm text-muted-foreground mb-2">Upload your collection logo</div>
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>NFT Artwork</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <div className="text-sm text-muted-foreground mb-2">
                        Upload your NFT images or metadata folder
                      </div>
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">Supported formats</div>
                        <div className="text-blue-700 dark:text-blue-200">
                          Images: JPG, PNG, GIF, SVG (max 10MB each)
                          <br />
                          Metadata: JSON files with properties and traits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Settings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply">Total Supply *</Label>
                      <Input
                        id="supply"
                        type="number"
                        placeholder="10000"
                        value={formData.supply}
                        onChange={(e) => handleInputChange("supply", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (ETH) *</Label>
                      <Input
                        id="mintPrice"
                        type="number"
                        step="0.001"
                        placeholder="0.05"
                        value={formData.mintPrice}
                        onChange={(e) => handleInputChange("mintPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="royalty">Royalty Percentage</Label>
                    <Input
                      id="royalty"
                      type="number"
                      max="10"
                      placeholder="5"
                      value={formData.royalty}
                      onChange={(e) => handleInputChange("royalty", e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Percentage of secondary sales you'll receive (max 10%)
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Minting Options</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Public Mint</Label>
                        <div className="text-sm text-muted-foreground">Allow anyone to mint your NFTs</div>
                      </div>
                      <Switch
                        checked={formData.publicMint}
                        onCheckedChange={(checked) => handleInputChange("publicMint", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Whitelist Mint</Label>
                        <div className="text-sm text-muted-foreground">Restrict minting to approved addresses</div>
                      </div>
                      <Switch
                        checked={formData.whitelistMint}
                        onCheckedChange={(checked) => handleInputChange("whitelistMint", checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Launch */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Rocket className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Ready to Launch!</h3>
                    <p className="text-muted-foreground">
                      Review your collection details and deploy to the blockchain.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Launch Checklist</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Collection details completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Artwork uploaded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Minting settings configured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Wallet connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Deployment Cost</div>
                        <div className="text-yellow-700 dark:text-yellow-200">
                          Estimated gas fee: ~0.05 ETH
                          <br />
                          This will deploy your smart contract to the blockchain.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Wallet className="mr-2 h-4 w-4" />
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
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>

              <div>
                <h3 className="font-semibold">{formData.name || "Collection Name"}</h3>
                <p className="text-sm text-muted-foreground">{formData.symbol || "SYMBOL"}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                {formData.description || "Collection description will appear here..."}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Blockchain:</span>
                  <Badge variant="secondary">{formData.blockchain || "Not selected"}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Supply:</span>
                  <span>{formData.supply || "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mint Price:</span>
                  <span>{formData.mintPrice || "0"} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Royalty:</span>
                  <span>{formData.royalty || "0"}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
