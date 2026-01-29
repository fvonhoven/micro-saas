"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@repo/firebase/client"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import hCaptcha to avoid SSR issues
const HCaptcha = dynamic(() => import("../../../components/HCaptcha"), { ssr: false })

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
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

    // Verify captcha is completed
    if (!captchaToken) {
      setError("Please complete the captcha verification")
      return
    }

    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Get ID token and create session cookie
      const idToken = await userCredential.user.getIdToken()
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      router.push("/dashboard")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to sign in")
      } else {
        setError("Failed to sign in")
      }
      setCaptchaToken(null) // Reset captcha on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Sign in to CronNarc</h1>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <HCaptcha onVerify={handleCaptchaVerify} onError={handleCaptchaError} onExpire={handleCaptchaExpire} />

          <Button type="submit" className="w-full" disabled={loading || !captchaToken}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Join the waitlist
          </Link>
        </p>
      </div>
    </div>
  )
}
