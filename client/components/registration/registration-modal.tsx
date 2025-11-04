"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { resetRegistration } from "@/lib/redux/features/registration/registrationSlice"
import RegistrationForm from "./registration-form"
import { useAuth } from "@/providers/auth-context"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function RegistrationModal({ isOpen, onClose, onComplete }: RegistrationModalProps) {
  const dispatch = useAppDispatch()
  const { logout, backendActor, setUser } = useAuth()
  const { isCompleted } = useAppSelector((state) => state.registration)


  useEffect(() => {
    if (isCompleted && backendActor) {
      const getUser = async () => {
        try {
          const user = await backendActor.get_user()
          if ("Ok" in user) {
            setUser(user.Ok)
            onClose()
          } else {
            console.warn("No user data found, keeping registration modal open.")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
      getUser()
    }
  }, [isCompleted, onClose])

  const handleCancel = () => {
    dispatch(resetRegistration())
    logout()
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY

      requestAnimationFrame(() => {
        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = "100%"
        document.body.style.overflow = "hidden"
      })

      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.overflow = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div
          className="w-full max-w-lg bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col space-y-1.5 p-6 pb-3">
              <div className="flex items-center justify-center">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Complete Your Registration</h2>
              </div>
              <p className="text-sm text-muted-foreground text-center">Finish setting up your account to get started</p>
            </div>
            <div className="p-6 pt-0">
              <RegistrationForm isModal={true} onComplete={onComplete || onClose} />

              {/* Cancel button - only show if not completed */}
              {!isCompleted && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    Cancel Registration
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
