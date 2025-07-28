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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={handleClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
          {/* Modal Content */}
          <div className="max-h-[80vh] overflow-y-auto">
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
      </div>
    </>
  )
}
