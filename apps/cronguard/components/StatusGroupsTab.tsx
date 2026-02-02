"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface StatusGroup {
  id: string
  name: string
  slug: string
  description?: string
  monitorIds: string[]
  enabled: boolean
  customTitle?: string
  customDescription?: string
  createdAt: any
  teamId?: string
}

interface StatusGroupsTabProps {
  currentWorkspace: {
    type: "personal" | "team"
    teamId?: string
    teamName?: string
  }
}

export function StatusGroupsTab({ currentWorkspace }: StatusGroupsTabProps) {
  const [groups, setGroups] = useState<StatusGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [currentWorkspace])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/status-groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error("Error fetching status groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this status group?")) {
      return
    }

    try {
      const response = await fetch(`/api/status-groups/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setGroups(groups.filter(g => g.id !== id))
      } else {
        alert("Failed to delete status group")
      }
    } catch (error) {
      console.error("Error deleting status group:", error)
      alert("Failed to delete status group")
    }
  }

  const toggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/status-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      })

      if (response.ok) {
        setGroups(groups.map(g => (g.id === id ? { ...g, enabled: !currentEnabled } : g)))
      } else {
        alert("Failed to update status group")
      }
    } catch (error) {
      console.error("Error updating status group:", error)
      alert("Failed to update status group")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Page Groups</h1>
          <p className="mt-2 text-gray-600">Create multi-monitor status pages for your services</p>
        </div>
        <Link
          href={
            currentWorkspace.type === "team" && currentWorkspace.teamId
              ? `/dashboard/status-groups/new?teamId=${currentWorkspace.teamId}`
              : "/dashboard/status-groups/new"
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Status Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No status groups yet</h3>
          <p className="text-gray-600 mb-6">Create your first status group to display multiple monitors on a single page</p>
          <Link
            href={
              currentWorkspace.type === "team" && currentWorkspace.teamId
                ? `/dashboard/status-groups/new?teamId=${currentWorkspace.teamId}`
                : "/dashboard/status-groups/new"
            }
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Status Group
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public URL</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map(group => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      {group.description && <div className="text-sm text-gray-500">{group.description}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{group.monitorIds.length} monitors</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleEnabled(group.id, group.enabled)}
                      className={`px-2 py-1 text-xs rounded-full ${group.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {group.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {group.enabled ? (
                      <a
                        href={`/status-group/${group.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Page →
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">Disabled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/status-groups/${group.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
