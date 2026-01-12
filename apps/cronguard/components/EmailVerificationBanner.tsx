"use client"

import { useState } from "react"
import { sendEmailVerification } from "firebase/auth"
import { auth } from "@repo/firebase/client"

interface EmailVerificationBannerProps {
  emailVerified: boolean
}

export function EmailVerificationBanner({ emailVerified }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleResendVerification = async () => {
    if (!auth.currentUser) return

    setSending(true)
    setError("")

    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      })
      setSent(true)
      setTimeout(() => setSent(false), 5000) // Hide success message after 5 seconds
    } catch (err: any) {
      setError(err.message || "Failed to send verification email")
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  // Don't show banner if email is verified
  if (emailVerified) {
    return null
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Email Verification Required</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Please verify your email address to create monitors and access all features.</p>
            {sent && <p className="mt-2 text-green-700 font-medium">✓ Verification email sent! Check your inbox.</p>}
            {error && <p className="mt-2 text-red-700">{error}</p>}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleResendVerification}
              disabled={sending || sent}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : sent ? "Email Sent!" : "Resend Verification Email"}
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              I've Verified - Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

