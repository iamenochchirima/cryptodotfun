"use client"

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setInterests, nextStep, prevStep } from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const interestOptions = [
  {
    id: "learn",
    label: "Learning & Education",
    description: "Courses and educational content about blockchain and crypto",
  },
  { id: "play", label: "Play & Games", description: "Blockchain games and tournaments" },
  { id: "btc-assets", label: "Bitcoin Assets", description: "Etching, trading, and collecting Bitcoin Runes, Ordinals, and inscriptions" },
  {
    id: "nft",
    label: "Multi-Chain NFTs Platform",
    description: "NFT marketplace for Ethereum, Solana, ICP and other blockchain NFTs",
  },
  { id: "tokens", label: "Token Trading Hub", description: "Complete token ecosystem - launchpad, trading, bots, and multi-chain support" },
  { id: "earn", label: "Earn & Rewards", description: "Earning crypto through activities and rewards" },
  { id: "secure", label: "Security & Protection", description: "Learning about crypto security best practices" },
  { id: "blog", label: "Blog & News", description: "Staying updated with the latest crypto news and insights" },
  { id: "community", label: "Community & Events", description: "Connecting with other crypto enthusiasts" },
]

export default function InterestsStep() {
  const dispatch = useAppDispatch()
  const { interests } = useAppSelector((state) => state.registration)

  const toggleInterest = (interest: string) => {
    const newInterests = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest]

    dispatch(setInterests(newInterests))
  }

  const handleContinue = () => {
    dispatch(nextStep())
  }

  const handleBack = () => {
    dispatch(prevStep())
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Your Interests</h2>
        <p className="text-muted-foreground mt-2">Select the features you're most interested in exploring</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interestOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-start space-x-3 p-4 border rounded-md hover:border-primary transition-colors"
            >
              <Checkbox
                id={option.id}
                checked={interests.includes(option.id)}
                onCheckedChange={() => toggleInterest(option.id)}
              />
              <div className="space-y-1">
                <Label htmlFor={option.id} className="font-medium cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={interests.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  )
}
