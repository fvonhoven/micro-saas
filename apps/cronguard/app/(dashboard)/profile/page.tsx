"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth, db } from "@repo/firebase/client"
import { doc, getDoc } from "firebase/firestore"
import { PLAN_METADATA } from "@repo/billing/client"

export default function ProfilePage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [showPlanChange, setShowPlanChange] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("annual")
  const [changingPlan, setChangingPlan] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch plan from API (server-side)
      const planResponse = await fetch("/api/user/plan")
      const planData = await planResponse.json()

      if (planData.plan) {
        setCurrentPlan(planData.plan)
      }

      // Fetch subscription data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data()
      setSubscriptionData(userData)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleManageBilling = async () => {
    setLoadingPortal(true)
    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error creating portal session:", error)
      alert("Failed to open billing portal. Please try again.")
    } finally {
      setLoadingPortal(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedPlan) return

    setChangingPlan(true)
    try {
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: selectedCycle,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully changed to ${data.newPlan} plan!`)
        setShowPlanChange(false)
        // Refresh user data
        await fetchUserData()
      } else {
        alert(data.error || "Failed to change plan")
      }
    } catch (error) {
      console.error("Error changing plan:", error)
      alert("Failed to change plan. Please try again.")
    } finally {
      setChangingPlan(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm")
      return
    }

    if (!confirm("Are you absolutely sure? This action cannot be undone. All your monitors, incidents, and data will be permanently deleted.")) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        // Sign out and redirect to home page
        await signOut(auth)
        router.push("/?deleted=true")
      } else {
        alert(data.error || "Failed to delete account. Please contact support.")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Failed to delete account. Please try again or contact support.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">CronNarc</h1>
          <div className="flex gap-4 items-center">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-3xl font-bold mb-8">Profile</h2>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Subscription</h3>

          {currentPlan && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Current Plan</label>
                <p className="text-2xl font-bold text-blue-600">{currentPlan.name}</p>
              </div>

              {currentPlan.monthlyPrice > 0 ? (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Price</label>
                    <p className="font-medium">
                      ${currentPlan.monthlyPrice}/month
                      {currentPlan.annualPrice !== currentPlan.monthlyPrice && (
                        <span className="text-sm text-gray-500 ml-2">(${currentPlan.annualPrice}/month billed annually)</span>
                      )}
                    </p>
                  </div>

                  {subscriptionData?.stripeCurrentPeriodEnd && (
                    <div>
                      <label className="text-sm text-gray-600">Next Billing Date</label>
                      <p className="font-medium">{formatDate(subscriptionData.stripeCurrentPeriodEnd)}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex gap-3">
                      <Button onClick={() => setShowPlanChange(!showPlanChange)} variant="outline">
                        {showPlanChange ? "Cancel" : "Change Plan"}
                      </Button>
                      <Button onClick={handleManageBilling} disabled={loadingPortal} variant="outline">
                        {loadingPortal ? "Loading..." : "Manage Billing"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      {showPlanChange ? "Select a new plan below" : "Update payment method, view invoices, or cancel subscription"}
                    </p>

                    {showPlanChange && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-4">
                        <h4 className="font-semibold text-gray-900">Select New Plan</h4>

                        {/* Billing Cycle Toggle */}
                        <div>
                          <label className="text-sm text-gray-600 mb-2 block">Billing Cycle</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCycle("monthly")}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedCycle === "monthly"
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => setSelectedCycle("annual")}
                              className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedCycle === "annual"
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              Annual{" "}
                              <span className={`text-xs font-semibold ${selectedCycle === "annual" ? "text-blue-100" : "text-green-600"}`}>
                                💰 Save 25%
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Plan Options */}
                        <div className="space-y-2">
                          {Object.entries(PLAN_METADATA.cronguard)
                            .filter(([key]) => key !== "free")
                            .map(([key, plan]) => {
                              const price = selectedCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice
                              const isCurrentPlan = currentPlan.name === plan.name
                              return (
                                <button
                                  key={key}
                                  onClick={() => setSelectedPlan(key)}
                                  disabled={isCurrentPlan}
                                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                    selectedPlan === key
                                      ? "border-blue-600 bg-blue-50"
                                      : isCurrentPlan
                                        ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                                        : "border-gray-200 hover:border-blue-300 bg-white"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h5 className="font-semibold text-gray-900">
                                        {plan.name}
                                        {isCurrentPlan && <span className="ml-2 text-xs text-gray-500">(Current)</span>}
                                      </h5>
                                      <p className="text-sm text-gray-600">
                                        {plan.limits.monitors} monitors • {plan.limits.minCheckIntervalMinutes}-min intervals
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-gray-900">${price}</p>
                                      <p className="text-xs text-gray-500">per month</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                        </div>

                        <Button onClick={handleChangePlan} disabled={!selectedPlan || changingPlan} className="w-full">
                          {changingPlan ? "Updating..." : "Confirm Plan Change"}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">You'll be charged or credited the prorated difference immediately</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="pt-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">🚀 Upgrade Your Plan</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Get access to more monitors, faster check intervals (1-minute checks!), and priority support.
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2 mb-4">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Up to 100 monitors (Team plan)
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        1-minute check intervals (Pro & Team)
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Save 25% with annual billing
                      </li>
                    </ul>
                  </div>
                  <Link href="/pricing">
                    <Button size="lg" className="w-full">
                      View Plans & Upgrade →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone - Delete Account (Fixed to Bottom) */}
      <div className="bg-gray-50 mt-12">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <button onClick={() => setShowDangerZone(!showDangerZone)} className="w-full flex items-center justify-between text-left group">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Delete Account</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDangerZone && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {!showDeleteConfirm ? (
                  <div>
                    <p className="text-gray-700 text-sm mb-3">Once you delete your account, there is no going back. This will permanently delete:</p>
                    <ul className="list-disc pl-5 text-gray-600 text-sm mb-4 space-y-1">
                      <li>All your monitors and their configurations</li>
                      <li>All incident history and analytics</li>
                      <li>All alert channels</li>
                      <li>All ping history</li>
                      <li>Your account and profile data</li>
                    </ul>
                    {currentPlan && currentPlan.name !== "Free" && (
                      <p className="text-gray-700 text-sm mb-4 font-medium">⚠️ Your active subscription will be canceled immediately.</p>
                    )}
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Delete Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-900 font-semibold text-sm">Are you absolutely sure?</p>
                    <p className="text-gray-600 text-sm">
                      This action <strong>cannot be undone</strong>. This will permanently delete your account and all associated data.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">DELETE</span> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Type DELETE"
                        disabled={deleting}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || deleting}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? "Deleting..." : "Permanently Delete Account"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText("")
                        }}
                        variant="outline"
                        size="sm"
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
