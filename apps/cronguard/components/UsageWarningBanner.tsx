"use client"

import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"

interface UsageWarningBannerProps {
  usage: number
  limit: number
  percentage: number
  planName: string
  suggestedTier?: {
    name: string
    monitors: number
    price: number
  }
}

export function UsageWarningBanner({ usage, limit, percentage, planName, suggestedTier }: UsageWarningBannerProps) {
  const router = useRouter()

  // Only show if at 80% or above
  if (percentage < 80) return null

  const isAtLimit = usage >= limit
  const bgColor = isAtLimit ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
  const textColor = isAtLimit ? "text-red-800" : "text-yellow-800"
  const iconColor = isAtLimit ? "text-red-600" : "text-yellow-600"

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {isAtLimit ? (
            <svg className={`w-6 h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className={`w-6 h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {isAtLimit ? "Monitor Limit Reached" : "Approaching Monitor Limit"}
          </h3>
          <p className={`text-sm ${textColor} mb-3`}>
            You're using <strong>{usage} of {limit} monitors</strong> on the <strong>{planName}</strong> plan.
            {isAtLimit
              ? " You cannot create new monitors until you upgrade or delete existing ones."
              : " Consider upgrading to avoid hitting your limit."}
          </p>

          {suggestedTier && (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className={textColor}>Upgrade to </span>
                <strong className={textColor}>{suggestedTier.name}</strong>
                <span className={textColor}> for {suggestedTier.monitors} monitors</span>
              </div>
              <Button size="sm" onClick={() => router.push("/pricing")}>
                Upgrade Now
              </Button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex-shrink-0 w-24">
          <div className="text-right text-sm font-semibold mb-1" style={{ color: percentage >= 100 ? "#dc2626" : percentage >= 80 ? "#d97706" : "#059669" }}>
            {percentage}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentage >= 100 ? "#dc2626" : percentage >= 80 ? "#d97706" : "#059669",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

