"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { cn } from "@/lib/utils"

const steps = [
  { id: 0, name: "Connect Wallet" },
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Referral" },
  { id: 3, name: "Interests" },
  { id: 4, name: "Confirmation" },
]

export default function RegistrationStepper() {
  const { currentStep } = useAppSelector((state) => state.registration)

  return (
    <div className="w-full mb-8">
      {/* Step indicator dots */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                step.id < currentStep ? "bg-green-500" : step.id === currentStep ? "bg-blue-500" : "bg-gray-300",
              )}
            />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1 transition-all duration-200",
                  step.id < currentStep ? "bg-green-500" : "bg-gray-300",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current step info */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-1">
          Step {currentStep + 1} of {steps.length}
        </div>
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{steps[currentStep]?.name}</div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
