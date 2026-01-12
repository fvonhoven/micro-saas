"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface PaymentWarningBannerProps {
  paymentStatus?: "active" | "past_due" | "canceled" | null
  gracePeriodEndsAt?: Date | null
}

export function PaymentWarningBanner({ paymentStatus, gracePeriodEndsAt }: PaymentWarningBannerProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (gracePeriodEndsAt) {
      const now = new Date()
      const endDate = gracePeriodEndsAt instanceof Date ? gracePeriodEndsAt : new Date(gracePeriodEndsAt)
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
    }
  }, [gracePeriodEndsAt])

  // Don't show banner if payment is active or no payment status
  if (!paymentStatus || paymentStatus === "active") {
    return null
  }

  // Subscription canceled
  if (paymentStatus === "canceled") {
    return (
      <div className="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-800">Subscription Canceled</h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>Your subscription has been canceled. Your monitors are currently paused.</p>
            </div>
            <div className="mt-4">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reactivate Subscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Payment past due
  if (paymentStatus === "past_due") {
    const isUrgent = daysRemaining !== null && daysRemaining <= 2

    return (
      <div className={`border-l-4 p-4 mb-6 ${isUrgent ? "bg-red-50 border-red-500" : "bg-yellow-50 border-yellow-500"}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${isUrgent ? "text-red-500" : "text-yellow-500"}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${isUrgent ? "text-red-800" : "text-yellow-800"}`}>
              {isUrgent ? "⚠️ Urgent: Payment Failed" : "Payment Failed"}
            </h3>
            <div className={`mt-2 text-sm ${isUrgent ? "text-red-700" : "text-yellow-700"}`}>
              <p>
                We were unable to process your payment. Your monitors will continue to work for{" "}
                <strong>
                  {daysRemaining !== null ? (daysRemaining === 1 ? "1 more day" : `${daysRemaining} more days`) : "a limited time"}
                </strong>
                .
              </p>
              {gracePeriodEndsAt && (
                <p className="mt-1">
                  Grace period ends:{" "}
                  <strong>
                    {new Date(gracePeriodEndsAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </strong>
                </p>
              )}
            </div>
            <div className="mt-4">
              <a
                href="/api/billing/create-portal-session"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isUrgent
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                }`}
              >
                Update Payment Method
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

