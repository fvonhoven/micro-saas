"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth, db } from "@repo/firebase/client"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import hCaptcha to avoid SSR issues
const HCaptcha = dynamic(() => import("../../../components/HCaptcha"), { ssr: false })

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setError("") // Clear any captcha errors
  }

  const handleCaptchaError = () => {
    setError("Captcha verification failed. Please try again.")
    setCaptchaToken(null)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
    setError("Captcha expired. Please verify again.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy to create an account")
      return
    }

    // Verify captcha is completed
    if (!captchaToken) {
      setError("Please complete the captcha verification")
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        createdAt: new Date(),
        emailVerified: false,
        stripeCustomerId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      })

      // Send email verification
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      })

      // Get ID token and create session cookie
      const idToken = await userCredential.user.getIdToken()
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      // Clear form fields for security (UX improvement)
      setEmail("")
      setPassword("")
      setName("")
      setAgreedToTerms(false)
      setCaptchaToken(null)

      setVerificationSent(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create account")
      } else {
        setError("Failed to create account")
      }
      setCaptchaToken(null) // Reset captcha on error
    } finally {
      setLoading(false)
    }
  }

  // Show success message after verification email is sent
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Check your email!</h1>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{email}</strong>. Please click the link in the email to verify your account.
            </p>
            <p className="text-sm text-gray-500 mb-6">After verifying your email, you can access your dashboard and start creating monitors.</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create your CronNarc account</h1>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="text-purple-600 hover:text-purple-700 underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-purple-600 hover:text-purple-700 underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <HCaptcha 
            onVerify={handleCaptchaVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
          />

          <Button type="submit" className="w-full" disabled={loading || !agreedToTerms || !captchaToken}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
