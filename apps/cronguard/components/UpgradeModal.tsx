"use client"

import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  currentLimit: number
  currentUsage: number
  suggestedTier?: {
    name: string
    monitors: number
    price: number
  }
  reason?: "limit_reached" | "near_limit"
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  currentLimit,
  currentUsage,
  suggestedTier,
  reason = "limit_reached",
}: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {reason === "limit_reached" ? "Monitor Limit Reached" : "Approaching Monitor Limit"}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {reason === "limit_reached" ? (
            <>
              You've reached your limit of <strong>{currentLimit} monitors</strong> on the{" "}
              <strong>{currentPlan}</strong> plan.
            </>
          ) : (
            <>
              You're using <strong>{currentUsage} of {currentLimit} monitors</strong> on the{" "}
              <strong>{currentPlan}</strong> plan.
            </>
          )}
        </p>

        {/* Suggested Tier */}
        {suggestedTier && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Upgrade to {suggestedTier.name}</h3>
              <span className="text-2xl font-bold text-blue-600">${suggestedTier.price}/mo</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Up to {suggestedTier.monitors} monitors</span>
              </div>
              {suggestedTier.name !== "Starter" && (
                <>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>1-minute check intervals</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Slack & webhook alerts</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            {reason === "limit_reached" ? "Upgrade Now" : "View Plans"}
          </Button>
        </div>
      </div>
    </div>
  )
}

