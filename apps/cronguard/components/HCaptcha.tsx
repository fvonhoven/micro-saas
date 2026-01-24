"use client"

import { useRef, useCallback, useEffect, memo } from "react"
import ReCAPTCHA from "@hcaptcha/react-hcaptcha"

interface HCaptchaProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  size?: "normal" | "compact" | "invisible"
  theme?: "light" | "dark"
}

/**
 * hCaptcha Component with React Strict Mode compatibility
 * 
 * Features:
 * - Automatic cleanup on unmount
 * - Memoized to prevent unnecessary re-renders
 * - Comprehensive error handling
 * - React 18 Strict Mode compatible (handles double mounting)
 */
const HCaptcha = memo<HCaptchaProps>(function HCaptcha({ 
  onVerify, 
  onError, 
  onExpire, 
  size = "normal",
  theme = "light" 
}) {
  const captchaRef = useRef<ReCAPTCHA>(null)
  const isMounted = useRef(true)

  // Get hCaptcha site key from environment
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  // Handle token verification
  const handleVerify = useCallback(
    (token: string) => {
      if (isMounted.current && token) {
        onVerify(token)
      }
    },
    [onVerify]
  )

  // Handle errors
  const handleError = useCallback(() => {
    if (isMounted.current) {
      console.error("[hCaptcha] Verification error")
      onError?.()
    }
  }, [onError])

  // Handle expiration
  const handleExpire = useCallback(() => {
    if (isMounted.current) {
      console.warn("[hCaptcha] Token expired")
      onExpire?.()
      // Auto-reset on expiration
      captchaRef.current?.resetCaptcha()
    }
  }, [onExpire])

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
      // Reset captcha on unmount to prevent memory leaks
      if (captchaRef.current) {
        try {
          captchaRef.current.resetCaptcha()
        } catch (error) {
          // Silently catch errors on unmount (component may be removed from DOM)
        }
      }
    }
  }, [])

  // Show error if site key is missing
  if (!siteKey) {
    console.error("[hCaptcha] NEXT_PUBLIC_HCAPTCHA_SITE_KEY is not set")
    return (
      <div className="text-red-600 text-sm p-2 border border-red-300 rounded bg-red-50">
        hCaptcha configuration error. Please contact support.
      </div>
    )
  }

  return (
    <div className="flex justify-center my-4">
      <ReCAPTCHA
        ref={captchaRef}
        sitekey={siteKey}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        size={size}
        theme={theme}
      />
    </div>
  )
})

export default HCaptcha
