"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  setEmail,
  setUsername,
  nextStep,
  prevStep,
  checkUsernameAvailability,
} from "@/lib/redux/features/registration/registrationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

export default function BasicInfoStep() {
  const dispatch = useAppDispatch()
  const { email, username, loading, usernameAvailable } = useAppSelector((state) => state.registration)

  const [emailError, setEmailError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [localUsername, setLocalUsername] = useState(username || "")

  const debouncedUsername = useDebounce(localUsername, 500)

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Check username availability when debounced username changes
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      dispatch(checkUsernameAvailability(debouncedUsername))
    }
  }, [debouncedUsername, dispatch])

  // Update username in redux when local username changes and is valid
  useEffect(() => {
    if (localUsername && localUsername.length >= 3 && !/[^a-zA-Z0-9_]/.test(localUsername)) {
      dispatch(setUsername(localUsername))
    }
  }, [localUsername, dispatch])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    dispatch(setEmail(newEmail))

    if (newEmail && !validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value
    setLocalUsername(newUsername)

    if (newUsername.length > 0 && newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters")
    } else if (newUsername && !/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError("Username can only contain letters, numbers, and underscores")
    } else {
      setUsernameError("")
    }
  }

  const handleContinue = () => {
    console.log("Continue clicked", { email, username: localUsername, usernameAvailable })

    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    if (!localUsername || localUsername.length < 3) {
      setUsernameError("Please enter a valid username")
      return
    }

    if (usernameAvailable === false) {
      setUsernameError("Please choose an available username")
      return
    }

    dispatch(nextStep())
  }

  const handleBack = () => {
    dispatch(prevStep())
  }

  // Simplified validation check
  const isEmailValid = email && validateEmail(email) && !emailError
  const isUsernameValid = localUsername && localUsername.length >= 3 && !usernameError
  const isUsernameAvailable = usernameAvailable === true || usernameAvailable === null

  const canContinue = isEmailValid && isUsernameValid && isUsernameAvailable && !loading

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground mt-2">Let's set up your account details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address (Optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            className={emailError ? "border-red-500" : isEmailValid ? "border-green-500" : ""}
          />
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          {isEmailValid && <p className="text-sm text-green-500">Valid email address</p>}
          <p className="text-xs text-muted-foreground">We'll only use your email for important account notifications</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              placeholder="coolcryptouser"
              value={localUsername}
              onChange={handleUsernameChange}
              className={usernameError ? "border-red-500 pr-10" : isUsernameValid ? "border-green-500 pr-10" : "pr-10"}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {loading && localUsername.length >= 3 && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!loading && usernameAvailable === true && localUsername.length >= 3 && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {!loading && usernameAvailable === false && localUsername.length >= 3 && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
          {!usernameError && usernameAvailable === false && (
            <p className="text-sm text-red-500">This username is already taken</p>
          )}
          {!usernameError && usernameAvailable === true && (
            <p className="text-sm text-green-500">Username is available</p>
          )}
          <p className="text-xs text-muted-foreground">
            Choose a unique username that will identify you on the platform
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className={canContinue ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          Continue
        </Button>
      </div>

      {/* Debug info - remove in production */}
      <div className="text-xs text-gray-500 mt-2">
        Debug: Email valid: {isEmailValid ? "✓" : "✗"}, Username valid: {isUsernameValid ? "✓" : "✗"}, Available:{" "}
        {usernameAvailable?.toString() || "null"}, Can continue: {canContinue ? "✓" : "✗"}
      </div>
    </div>
  )
}
