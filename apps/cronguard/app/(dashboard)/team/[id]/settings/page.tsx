"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@repo/firebase/client"

interface TeamMember {
  id: string
  userId: string
  email: string
  displayName: string
  role: string
  joinedAt: any
}

interface TeamInvite {
  id: string
  email: string
  role: string
  invitedAt: any
  status: string
}

interface Team {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: any
  role: string
}

export default function TeamSettingsPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member")
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  // Edit team name
  const [editingName, setEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && teamId) {
      fetchTeam()
      fetchMembers()
      fetchInvites()
    }
  }, [user, teamId])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
        setNewTeamName(data.team.name)
      } else if (response.status === 404) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    } finally {
      setLoadingTeam(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchInvites = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invites`)
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites || [])
      }
    } catch (error) {
      console.error("Error fetching invites:", error)
    } finally {
      setLoadingInvites(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError("")
    setInviteSuccess("")
    setSendingInvite(true)

    try {
      const response = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setInviteSuccess(`Invite sent to ${inviteEmail}`)
        setInviteEmail("")
        setInviteRole("member")
        fetchInvites()
      } else {
        setInviteError(data.error || "Failed to send invite")
      }
    } catch (error) {
      setInviteError("An error occurred while sending the invite")
    } finally {
      setSendingInvite(false)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to cancel this invite?")) return

    try {
      const response = await fetch(`/api/teams/${teamId}/invites/${inviteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchInvites()
      }
    } catch (error) {
      console.error("Error cancelling invite:", error)
    }
  }

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) return

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchMembers()
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        fetchMembers()
      }
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  const handleSaveTeamName = async () => {
    if (!newTeamName.trim()) return

    setSavingName(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      })

      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
        setEditingName(false)
      }
    } catch (error) {
      console.error("Error updating team name:", error)
    } finally {
      setSavingName(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" })
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "member":
        return "bg-green-100 text-green-700 border-green-200"
      case "viewer":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const canManageTeam = team?.role === "owner" || team?.role === "admin"

  if (loading || loadingTeam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading team settings...</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return null
  }

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
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Profile Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Settings</h1>
              <p className="text-gray-600 mt-1">Manage your team members and settings</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(team.role)}`}>{team.role}</div>
          </div>
        </div>

        {/* Team Name */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Team Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={savingName}
                  />
                  <button
                    onClick={handleSaveTeamName}
                    disabled={savingName || !newTeamName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false)
                      setNewTeamName(team.name)
                    }}
                    disabled={savingName}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{team.name}</span>
                  {canManageTeam && (
                    <button onClick={() => setEditingName(true)} className="text-blue-600 hover:underline text-sm">
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Members */}
        {canManageTeam && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Invite Team Members</h2>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={sendingInvite}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendingInvite}
                  >
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="member">Member - Can create monitors</option>
                    <option value="admin">Admin - Can manage team</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={sendingInvite}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingInvite ? "Sending..." : "Send Invite"}
              </button>
              {inviteError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{inviteError}</div>}
              {inviteSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{inviteSuccess}</div>}
            </form>
          </div>
        )}

        {/* Pending Invites */}
        {canManageTeam && invites.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
            <div className="space-y-3">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{invite.email}</div>
                    <div className="text-sm text-gray-500">
                      Invited as {invite.role} • {new Date(invite.invitedAt?.seconds * 1000 || invite.invitedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => handleCancelInvite(invite.id)} className="text-red-600 hover:underline text-sm">
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Team Members ({members.length})</h2>
          {loadingMembers ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-gray-600">Loading members...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {member.email[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.displayName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.joinedAt?.seconds * 1000 || member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManageTeam && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={e => handleUpdateRole(member.userId, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(member.role)}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(member.role)}`}>{member.role}</div>
                    )}
                    {canManageTeam && member.role !== "owner" && (
                      <button onClick={() => handleRemoveMember(member.userId, member.email)} className="text-red-600 hover:underline text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
