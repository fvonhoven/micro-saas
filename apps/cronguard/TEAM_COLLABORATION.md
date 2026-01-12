# Team Collaboration Architecture

## Overview

CronNarc supports team collaboration, allowing users to create teams, invite members, and share monitors with different permission levels.

## Data Model

### 1. Teams Collection (`teams`)

```typescript
{
  id: string                    // Auto-generated
  name: string                  // Team name (e.g., "Acme Corp Engineering")
  slug: string                  // URL-friendly slug (e.g., "acme-corp-engineering")
  ownerId: string               // User ID of team owner
  createdAt: Date
  updatedAt: Date
  
  // Subscription (teams can have their own subscription)
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  stripeCurrentPeriodEnd?: Date
}
```

### 2. Team Members Collection (`team_members`)

```typescript
{
  id: string                    // Auto-generated
  teamId: string                // Reference to team
  userId: string                // Reference to user
  role: "owner" | "admin" | "member" | "viewer"
  joinedAt: Date
  invitedBy: string             // User ID who invited this member
}
```

**Roles:**
- `owner`: Full control, can delete team, manage billing
- `admin`: Can invite/remove members, manage all monitors
- `member`: Can create/edit/delete own monitors, view team monitors
- `viewer`: Read-only access to all team monitors

### 3. Team Invites Collection (`team_invites`)

```typescript
{
  id: string                    // Auto-generated
  teamId: string                // Reference to team
  teamName: string              // Denormalized for email
  email: string                 // Email of invitee
  role: "admin" | "member" | "viewer"
  invitedBy: string             // User ID who sent invite
  invitedAt: Date
  expiresAt: Date               // 7 days from invitedAt
  status: "pending" | "accepted" | "expired" | "cancelled"
  token: string                 // Unique token for invite link
}
```

### 4. Updated Monitors Collection

Add team ownership fields:

```typescript
{
  // Existing fields...
  userId: string                // Individual owner (for personal monitors)
  
  // New team fields
  teamId?: string               // Team owner (if team monitor)
  createdBy: string             // User who created the monitor
  
  // Existing fields...
}
```

**Ownership Rules:**
- If `teamId` is set, monitor belongs to team
- If `teamId` is null, monitor belongs to individual user
- `createdBy` tracks who created it (for audit trail)

## User Experience

### Personal vs Team Workspace

Users can switch between:
1. **Personal Workspace**: Their own monitors (where `userId = currentUser.uid` and `teamId = null`)
2. **Team Workspaces**: Team monitors (where `teamId = selectedTeam.id`)

### Team Selector UI

Navbar includes a dropdown:
```
┌─────────────────────────┐
│ 👤 Personal Workspace   │ ← Default
├─────────────────────────┤
│ 👥 Acme Corp            │
│ 👥 Freelance Clients    │
└─────────────────────────┘
```

### Monitor Limits

- **Personal monitors**: Count against user's personal plan
- **Team monitors**: Count against team's plan
- Teams can have their own subscription separate from individual members

## Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View team monitors | ✅ | ✅ | ✅ | ✅ |
| Create monitors | ✅ | ✅ | ✅ | ❌ |
| Edit own monitors | ✅ | ✅ | ✅ | ❌ |
| Edit others' monitors | ✅ | ✅ | ❌ | ❌ |
| Delete own monitors | ✅ | ✅ | ✅ | ❌ |
| Delete others' monitors | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete team | ✅ | ❌ | ❌ | ❌ |

## API Endpoints

### Team Management

- `POST /api/teams` - Create a new team
- `GET /api/teams` - List user's teams
- `GET /api/teams/[id]` - Get team details
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team (owner only)

### Team Members

- `GET /api/teams/[id]/members` - List team members
- `DELETE /api/teams/[id]/members/[userId]` - Remove member
- `PATCH /api/teams/[id]/members/[userId]` - Update member role

### Team Invites

- `POST /api/teams/[id]/invites` - Send invite
- `GET /api/teams/[id]/invites` - List pending invites
- `DELETE /api/teams/[id]/invites/[inviteId]` - Cancel invite
- `POST /api/invites/accept` - Accept invite (public endpoint)
- `GET /api/invites/[token]` - Get invite details (public endpoint)

### Updated Monitor Endpoints

- `GET /api/monitors?teamId=xxx` - List team monitors
- `POST /api/monitors` - Create monitor (add `teamId` param)

## Firestore Security Rules

```javascript
// Teams
match /teams/{teamId} {
  allow read: if isTeamMember(teamId);
  allow create: if isAuthenticated();
  allow update: if isTeamAdmin(teamId);
  allow delete: if isTeamOwner(teamId);
}

// Team Members
match /team_members/{memberId} {
  allow read: if isTeamMember(resource.data.teamId);
  allow create: if isTeamAdmin(request.resource.data.teamId);
  allow delete: if isTeamAdmin(resource.data.teamId) || request.auth.uid == resource.data.userId;
  allow update: if isTeamAdmin(resource.data.teamId);
}

// Team Invites
match /team_invites/{inviteId} {
  allow read: if isTeamAdmin(resource.data.teamId) || request.auth.token.email == resource.data.email;
  allow create: if isTeamAdmin(request.resource.data.teamId);
  allow update, delete: if isTeamAdmin(resource.data.teamId);
}

// Updated Monitors
match /monitors/{monitorId} {
  allow read: if isOwner(resource.data.userId) || isTeamMember(resource.data.teamId);
  allow create: if isAuthenticated() && 
    (request.resource.data.userId == request.auth.uid || canCreateTeamMonitor(request.resource.data.teamId));
  allow update, delete: if isOwner(resource.data.userId) || canManageTeamMonitor(resource.data.teamId, resource.data.createdBy);
}
```

## Implementation Phases

1. ✅ **Phase 1**: Data model design (this document)
2. **Phase 2**: API endpoints for team management
3. **Phase 3**: Team selector UI component
4. **Phase 4**: Team settings page
5. **Phase 5**: Update monitor ownership model
6. **Phase 6**: Team invite email flow

