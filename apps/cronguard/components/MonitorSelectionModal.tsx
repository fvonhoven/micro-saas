"use client"

import { useState } from "react"
import { Button } from "@repo/ui"

interface Monitor {
  id: string
  name: string
  status: string
  lastPingAt?: any
}

interface MonitorSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedMonitorIds: string[]) => void
  monitors: Monitor[]
  currentLimit: number
  newLimit: number
  newPlanName: string
}

export function MonitorSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  monitors,
  currentLimit,
  newLimit,
  newPlanName,
}: MonitorSelectionModalProps) {
  const [selectedMonitors, setSelectedMonitors] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const monitorsToDisable = monitors.length - newLimit
  const canProceed = selectedMonitors.size === newLimit

  const toggleMonitor = (monitorId: string) => {
    const newSelected = new Set(selectedMonitors)
    if (newSelected.has(monitorId)) {
      newSelected.delete(monitorId)
    } else {
      if (newSelected.size < newLimit) {
        newSelected.add(monitorId)
      }
    }
    setSelectedMonitors(newSelected)
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedMonitors))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Monitors to Keep</h2>
          <p className="text-gray-600">
            You're downgrading to the <strong>{newPlanName}</strong> plan, which allows <strong>{newLimit} monitors</strong>.
            You currently have <strong>{monitors.length} monitors</strong>.
          </p>
          <p className="text-red-600 font-semibold mt-2">
            Please select {newLimit} monitor{newLimit !== 1 ? "s" : ""} to keep. The remaining {monitorsToDisable} will be
            archived for 30 days.
          </p>
        </div>

        {/* Monitor List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {monitors.map(monitor => {
              const isSelected = selectedMonitors.has(monitor.id)
              const canSelect = isSelected || selectedMonitors.size < newLimit

              return (
                <button
                  key={monitor.id}
                  onClick={() => canSelect && toggleMonitor(monitor.id)}
                  disabled={!canSelect}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : canSelect
                        ? "border-gray-200 hover:border-gray-300 bg-white"
                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Monitor Info */}
                      <div>
                        <h3 className="font-semibold text-gray-900">{monitor.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                              monitor.status === "HEALTHY"
                                ? "bg-green-100 text-green-800"
                                : monitor.status === "DOWN"
                                  ? "bg-red-100 text-red-800"
                                  : monitor.status === "LATE"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {monitor.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Selected: <strong>{selectedMonitors.size}</strong> of <strong>{newLimit}</strong>
            </p>
            {!canProceed && (
              <p className="text-sm text-red-600 font-semibold">Please select {newLimit - selectedMonitors.size} more</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canProceed} className="flex-1">
              Confirm Downgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

