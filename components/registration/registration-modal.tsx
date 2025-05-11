"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { resetRegistration } from "@/lib/redux/features/registration/registrationSlice"
import RegistrationForm from "./registration-form"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const dispatch = useAppDispatch()
  const { isCompleted } = useAppSelector((state) => state.registration)

  // Close modal after successful registration
  useEffect(() => {
    if (isCompleted) {
      // Wait for success animation before closing
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, onClose])

  // Handle modal close
  const handleClose = () => {
    dispatch(resetRegistration())
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-all duration-100"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-[50%] top-[50%] z-50 w-[95%] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden border bg-background shadow-lg duration-200 rounded-lg">
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Join CryptoDotFun</h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Create your account to get started</p>
          </div>
          <div className="p-6 pt-0">
            <RegistrationForm isModal={true} onComplete={onClose} />
          </div>
        </div>
      </div>
    </>
  )
}
