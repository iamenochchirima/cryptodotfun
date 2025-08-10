"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setAgreedToTerms, prevStep, completeRegistration } from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/providers/auth-context"

const referralSourceLabels: Record<string, string> = {
  search: "Search Engine",
  social: "Social Media",
  friend: "Friend or Colleague",
  ad: "Advertisement",
  blog: "Blog or Article",
  podcast: "Podcast",
  event: "Event or Conference",
  other: "Other",
}

const interestLabels: Record<string, string> = {
  LEARNING: "Learning & Education",
  GAMING: "Play & Games",
  BTC_ASSETS: "Bitcoin Assets",
  NFTS: "Multi-Chain NFTs Platform",
  TOKENS: "Token Trading Hub",
  EARNING: "Earn & Rewards",
  SECURITY: "Security & Protection",
  COMMUNITY: "Community & Events",
}

export default function ConfirmationStep() {
  const { sessionData, backendActor } = useAuth()
  const dispatch = useAppDispatch()
  const { email, username, referralSource, referralCode, interests, agreedToTerms, loading } =
    useAppSelector((state) => state.registration)

  const [termsError, setTermsError] = useState("")

  const handleTermsChange = (checked: boolean) => {
    dispatch(setAgreedToTerms(checked))
    if (checked) {
      setTermsError("")
    }
  }

  const handleComplete = () => {
    if (!agreedToTerms) {
      setTermsError("You must agree to the terms and conditions")
      return
    }

    dispatch(
      completeRegistration({
        sessionData,
        backendActor,
        email,
        username,
        referralSource,
        referralCode,
        interests,
        agreedToTerms,
      }),
    )
  }

  const handleBack = () => {
    dispatch(prevStep())
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Confirm Your Details</h2>
        <p className="text-muted-foreground mt-2">Please review your information before completing registration</p>
      </div>

      <div className="space-y-4 bg-muted p-4 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {email && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-sm">{email}</p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
            <p className="text-sm">{username}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Referral Source</h3>
            <p className="text-sm">
              {referralSource ? referralSourceLabels[referralSource] || referralSource : "Not specified"}
            </p>
          </div>
          {referralCode && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Referral Code</h3>
              <p className="text-sm">{referralCode}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {interestLabels[interest] || interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => handleTermsChange(checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="font-medium cursor-pointer">
              I agree to the Terms of Service and Privacy Policy
            </Label>
            <p className="text-sm text-muted-foreground">
              By checking this box, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
            {termsError && <p className="text-sm text-red-500">{termsError}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={!agreedToTerms || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Registration
            </>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </div>
    </div>
  )
}
