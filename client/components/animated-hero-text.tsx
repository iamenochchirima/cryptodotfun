"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const words = ["Learn", "Earn", "Secure", "Connect"]

export function AnimatedHeroText() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(150)

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentWord = words[currentWordIndex]

      if (!isDeleting) {
        // Typing
        setCurrentText(currentWord.substring(0, currentText.length + 1))
        setTypingSpeed(150)

        // If word is complete
        if (currentText === currentWord) {
          // Pause at the end of the word
          setTypingSpeed(1500)
          setIsDeleting(true)
        }
      } else {
        // Deleting
        setCurrentText(currentWord.substring(0, currentText.length - 1))
        setTypingSpeed(75)

        // If deletion is complete
        if (currentText === "") {
          setIsDeleting(false)
          setCurrentWordIndex((currentWordIndex + 1) % words.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [currentText, currentWordIndex, isDeleting, typingSpeed])

  return (
    <span
      className={cn(
        "crypto-gradient-text inline-block min-w-[240px] animate-pulse",
        isDeleting ? "after:content-['|']" : "after:content-['|'] after:animate-blink",
      )}
    >
      {currentText}
    </span>
  )
}
