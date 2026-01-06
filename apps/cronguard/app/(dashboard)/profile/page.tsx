"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth, db } from "@repo/firebase/client"
import { doc, getDoc } from "firebase/firestore"

export default function ProfilePage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

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

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
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
          <h1 className="text-xl font-bold">CronGuard</h1>
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
            <div>
              <label className="text-sm text-gray-600">User ID</label>
              <p className="font-mono text-sm text-gray-700">{user.uid}</p>
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

                  <div className="pt-4 border-t">
                    <Button onClick={handleManageBilling} disabled={loadingPortal}>
                      {loadingPortal ? "Loading..." : "Manage Subscription"}
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">Update payment method, view invoices, or cancel subscription</p>
                  </div>
                </>
              ) : (
                <div className="pt-4">
                  <Link href="/pricing">
                    <Button>Upgrade to Pro</Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-2">Unlock more monitors and faster check intervals</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
