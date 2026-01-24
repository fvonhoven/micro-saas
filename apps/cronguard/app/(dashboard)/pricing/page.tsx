"use client"

import { useAuthContext } from "@repo/auth"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { PLAN_METADATA } from "@repo/billing/client"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@repo/firebase/client"

export default function PricingPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<{ name: string } | null>(null)

  // Fetch user's current plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/user/plan")
        const data = await response.json()

        if (data.plan) {
          setCurrentPlan(data.plan)
        }
      } catch (error) {
        console.error("Error fetching user plan:", error)
      }
    }

    fetchUserPlan()
  }, [user])

  const handleLogout = async () => {
    try {
      // Delete session cookie
      await fetch("/api/auth/session", { method: "DELETE" })
      // Sign out from Firebase
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    setLoading(planId)

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again.")
      setLoading(null)
    }
  }

  const plans = [
    { ...PLAN_METADATA.cronguard.free, id: "free" },
    { ...PLAN_METADATA.cronguard.starter, id: "starter" },
    { ...PLAN_METADATA.cronguard.pro, id: "pro" },
    { ...PLAN_METADATA.cronguard.team, id: "team" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            CronNarc
          </Link>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
                  Dashboard
                </Button>

                {/* Profile Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        Dashboard
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button onClick={() => router.push("/login")} variant="outline">
                  Sign In
                </Button>
                <Button onClick={() => router.push("/signup")}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 mb-8">Monitor your cron jobs with confidence</p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === "monthly" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === "annual" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Save 25%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map(plan => {
            const isCurrentPlan = currentPlan?.name === plan.name
            const isPopular = plan.id === "pro"

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${isCurrentPlan ? "ring-2 ring-green-500 hover:ring-green-600" : isPopular ? "ring-2 ring-blue-500 hover:ring-blue-600" : "hover:ring-2 hover:ring-gray-300"}`}
              >
                <div className="flex-grow">
                  {isCurrentPlan && (
                    <div className="text-center mb-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Current Plan</span>
                    </div>
                  )}
                  {!isCurrentPlan && isPopular && (
                    <div className="text-center mb-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Popular</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    {plan.id !== "free" ? (
                      <>
                        <span className="text-4xl font-bold">${billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice}</span>
                        <span className="text-gray-600">/month</span>
                        {billingCycle === "annual" && <div className="text-sm text-gray-500 mt-1">Billed ${plan.annualPrice * 12}/year</div>}
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                        <span className="text-gray-600">/month</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {plan.limits.monitors} monitors
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Email alerts
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {plan.id === "free" || plan.id === "starter" ? "5-minute checks" : "1-minute checks"}
                    </li>
                  </ul>
                </div>
                {isCurrentPlan ? (
                  <Button className="w-full mt-auto" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : plan.id !== "free" ? (
                  <Button className="w-full mt-auto" onClick={() => handleSubscribe(plan.id)} disabled={loading === plan.id}>
                    {loading === plan.id ? "Loading..." : "Subscribe"}
                  </Button>
                ) : (
                  <Button className="w-full mt-auto" variant="outline" onClick={() => router.push("/signup")}>
                    Get Started Free
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
