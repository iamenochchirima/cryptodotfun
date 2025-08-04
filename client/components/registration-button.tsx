"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import RegistrationModal from "./registration/registration-modal"

interface RegistrationButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function RegistrationButton({
  variant = "default",
  size = "default",
  className = "",
}: RegistrationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <>
      <Button variant={variant} size={size} onClick={openModal} className={className}>
        Sign Up
      </Button>
      <RegistrationModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
}
