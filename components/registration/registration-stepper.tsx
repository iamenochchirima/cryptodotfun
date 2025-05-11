"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { CheckIcon } from "lucide-react"
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
    <div className="hidden sm:block">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={cn(stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "", "relative flex-1")}>
              {step.id < currentStep ? (
                <div className="flex flex-col items-start">
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                      <span className="sr-only">{step.name}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                </div>
              ) : step.id === currentStep ? (
                <div className="flex flex-col items-start">
                  <div className="flex items-center" aria-current="step">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                      <span className="sr-only">{step.name}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary">{step.name}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start">
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted">
                      <span className="text-sm text-muted-foreground">{step.id + 1}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-muted-foreground">{step.name}</span>
                  </div>
                </div>
              )}
              {stepIdx !== steps.length - 1 ? (
                <div
                  className={cn(
                    step.id < currentStep ? "bg-primary" : "bg-muted",
                    "absolute right-0 top-4 hidden h-0.5 w-5/6 sm:block",
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      {/* Mobile stepper */}
      <div className="sm:hidden">
        <p className="text-sm font-medium">
          Step {currentStep + 1} of {steps.length}
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
