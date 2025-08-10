"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { resetRegistration } from "@/lib/redux/features/registration/registrationSlice"
import RegistrationStepper from "./registration-stepper"
import BasicInfoStep from "./steps/basic-info-step"
import ReferralStep from "./steps/referral-step"
import InterestsStep from "./steps/interests-step"
import ConfirmationStep from "./steps/confirmation-step"
import SuccessStep from "./steps/success-step"

interface RegistrationFormProps {
  isModal?: boolean
  onComplete?: () => void
}

export default function RegistrationForm({ isModal = false, onComplete }: RegistrationFormProps) {
  const { currentStep, isCompleted, username } = useAppSelector((state) => state.registration)
  const dispatch = useAppDispatch()
  const router = useRouter()

  // Reset registration form on component mount if not in modal
  useEffect(() => {
    if (!isModal) {
      dispatch(resetRegistration())
    }
  }, [dispatch, isModal])

  // Handle completion
  useEffect(() => {
    if (isCompleted) {
      if (onComplete) {
        onComplete()
      }
      
      if (!isModal) {
        router.push("/dashboard")
      }
    }
  }, [isCompleted, router, isModal, onComplete])

  // Render the current step (skipping wallet connection step)
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />
      case 1:
        return <ReferralStep />
      case 2:
        return <InterestsStep />
      case 3:
        return <ConfirmationStep />
      case 4:
        return <SuccessStep />
      default:
        return <BasicInfoStep />
    }
  }

  return (
    <div className={isModal ? "" : "bg-card border rounded-lg shadow-sm p-6"}>
      <RegistrationStepper />
      <div className="mt-8">{renderStep()}</div>
    </div>
  )
}
