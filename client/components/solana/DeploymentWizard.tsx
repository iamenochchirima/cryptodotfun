"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Rocket,
  Upload,
  Database,
  Code,
} from "lucide-react"

type DeploymentStep =
  | "idle"
  | "saving_draft"
  | "uploading_arweave"
  | "deploying_solana"
  | "updating_canister"
  | "completed"
  | "error"

interface DeploymentStatus {
  step: DeploymentStep
  progress: number
  message: string
  error?: string
  transactionHash?: string
  collectionAddress?: string
}

interface DeploymentWizardProps {
  collectionData: any
  assets: File[]
  onComplete?: (result: any) => void
  onCancel?: () => void
}

export function DeploymentWizard({
  collectionData,
  assets,
  onComplete,
  onCancel,
}: DeploymentWizardProps) {
  const [status, setStatus] = useState<DeploymentStatus>({
    step: "idle",
    progress: 0,
    message: "Ready to deploy",
  })

  const steps = [
    {
      id: "saving_draft",
      title: "Save Draft",
      description: "Storing collection data in canister",
      icon: Database,
    },
    {
      id: "uploading_arweave",
      title: "Upload to Arweave",
      description: "Uploading assets to permanent storage",
      icon: Upload,
    },
    {
      id: "deploying_solana",
      title: "Deploy on Solana",
      description: "Creating collection on blockchain",
      icon: Code,
    },
    {
      id: "updating_canister",
      title: "Update Canister",
      description: "Finalizing collection info",
      icon: Database,
    },
  ]

  const handleDeploy = async () => {
    try {
      // Step 1: Save draft to canister
      setStatus({
        step: "saving_draft",
        progress: 10,
        message: "Saving collection draft...",
      })
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
      // TODO: Actual canister call to save draft

      // Step 2: Upload to Arweave
      setStatus({
        step: "uploading_arweave",
        progress: 35,
        message: "Uploading assets to Arweave...",
      })
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate upload
      // TODO: Actual Arweave upload using Bundlr

      // Step 3: Deploy on Solana
      setStatus({
        step: "deploying_solana",
        progress: 70,
        message: "Deploying collection on Solana...",
      })
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate deployment
      // TODO: Actual Metaplex deployment

      // Step 4: Update canister with deployment info
      setStatus({
        step: "updating_canister",
        progress: 90,
        message: "Updating collection information...",
      })
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate update
      // TODO: Update canister with Solana address and Arweave URIs

      // Complete
      setStatus({
        step: "completed",
        progress: 100,
        message: "Collection deployed successfully!",
        collectionAddress: "ABC123...XYZ789", // Mock address
        transactionHash: "tx_hash_123", // Mock tx hash
      })

      onComplete?.({
        collectionAddress: "ABC123...XYZ789",
        transactionHash: "tx_hash_123",
      })
    } catch (error: any) {
      setStatus({
        step: "error",
        progress: status.progress,
        message: "Deployment failed",
        error: error.message || "Unknown error occurred",
      })
    }
  }

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex((s) => s.id === status.step)
    const stepIndex = steps.findIndex((s) => s.id === stepId)

    if (status.step === "error") return "error"
    if (status.step === "completed" || stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Deploy Collection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{status.message}</span>
            <span className="text-muted-foreground">{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const stepStatus = getStepStatus(step.id)
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  stepStatus === "active"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                    : stepStatus === "completed"
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : stepStatus === "error"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : "border-muted"
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {stepStatus === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : stepStatus === "active" ? (
                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  ) : stepStatus === "error" ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{step.title}</h4>
                    {stepStatus === "active" && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-900">
                        In Progress
                      </Badge>
                    )}
                    {stepStatus === "completed" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-900">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {status.step === "error" && status.error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">
                  Deployment Failed
                </div>
                <div className="text-sm text-red-700 dark:text-red-200 mt-1">
                  {status.error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status.step === "completed" && (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Collection Deployed Successfully!
                </div>
                {status.collectionAddress && (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-green-700 dark:text-green-200">
                        Collection Address:
                      </span>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
                        {status.collectionAddress}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          {status.step === "idle" && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleDeploy}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Start Deployment
              </Button>
            </>
          )}
          {status.step === "completed" && (
            <Button onClick={onComplete} className="w-full">
              View Collection
            </Button>
          )}
          {status.step === "error" && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleDeploy}>Retry Deployment</Button>
            </>
          )}
          {!["idle", "completed", "error"].includes(status.step) && (
            <div className="w-full text-center text-sm text-muted-foreground">
              Please do not close this window...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
