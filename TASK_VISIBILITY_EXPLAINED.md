# Task Visibility & Privacy - How It Works

## Overview
The daily tasks system has role-based visibility to ensure privacy and appropriate access control.

## Visibility Rules

### 👤 STAFF Users
**What they can see:**
- ✅ Only their own tasks
- ✅ Task history of other users (when clicking usernames)

**What they CANNOT see:**
- ❌ Other staff members' current tasks in the main list
- ❌ Organization-wide task list

**Example:**
```
John (STAFF) creates: "Processing invoices for ABC Corp"
Mary (STAFF) creates: "Auditing financial statements for XYZ Ltd"

John's view: Only sees his own task
Mary's view: Only sees her own task

❌ They cannot see each other's tasks in the main list
✅ They CAN click each other's names to view history
```

### 👨‍💼 SUPERVISOR Users
**Same as STAFF:**
- Only see their own tasks by default
- Can view others' history via username clicks

### 👔 MANAGER & ADMIN Users
**What they can see:**
- ✅ All tasks from all users (default view)
- ✅ Can filter by specific user
- ✅ Can view anyone's task history
- ✅ Organization-wide statistics

**What they can do:**
- ✅ Delete any task (STAFF can only delete their own)
- ✅ View cross-team analytics
- ✅ Filter by user to see individual productivity

**Example:**
```
Manager Dashboard shows:
- John's task: "Processing invoices for ABC Corp"
- Mary's task: "Auditing financial statements for XYZ Ltd"
- Sarah's task: "Preparing tax returns for LMN Inc"

Manager can see ALL of these tasks
```

## Technical Implementation

### Backend (API) - `/src/app/api/tasks/route.ts`

```typescript
// Line 26-27: STAFF restriction
if (session.user.role === "STAFF" && !showAll) {
  where.userId = session.user.id;
}
```

This ensures:
1. **STAFF users**: Query always filters to `userId = session.user.id`
2. **ADMIN/MANAGER**: No automatic filter, sees all tasks when `showAll=true`

### Frontend - `/src/app/tasks/page.tsx`

```typescript
// Line 91-93: Auto-enable showAll for admins/managers
if (canDelete && !selectedUser && !viewingUserHistory) {
  params.append("showAll", "true");
}
```

This ensures:
1. Admins/Managers automatically see all tasks
2. When filtering by specific user, only that user's tasks show
3. STAFF users never send `showAll=true`

## Privacy Features

### ✅ What's Private
1. **Task titles** - Only creator (or admin/manager) can see in main list
2. **Task descriptions** - Private to creator (or admin/manager)
3. **Client names** - Only visible to creator (or admin/manager)
4. **Time tracking** - Private time data for each user

### 👁️ What's Visible to Everyone
1. **Usernames** - Anyone can see who created tasks
2. **User history** - Click any username to see their public task history
3. **Statistics** - Admins/Managers see organization stats, STAFF see only their own

## User History Feature

### How It Works
When clicking a username anywhere in the app:
1. Sets `viewingUserHistory` state to that user's ID
2. API fetches only that user's tasks
3. Shows complete history with time tracking
4. Available to ALL users (STAFF can view others' history)

### Why Allow This?
- **Transparency**: Team members can see what others are working on
- **Collaboration**: Helps identify who to ask for help
- **Accountability**: Public history promotes productivity
- **Learning**: See how others organize and complete tasks

**Example:**
```
Mary (STAFF) clicks on "John" in any task card
→ Mary now sees ALL of John's historical tasks
→ Includes completed, pending, and in-progress tasks
→ Shows John's time tracking data
```

## Statistics Dashboard

### STAFF View
Shows only their own metrics:
- Today: My tasks created today
- Pending: My pending tasks
- Active: My in-progress tasks
- Completed: My completed tasks
- Time: My total time spent

### ADMIN/MANAGER View
Shows organization-wide metrics:
- Today: All tasks created today
- Pending: All pending tasks across team
- Active: All in-progress tasks
- Completed: All completed tasks
- Time: Total time spent by entire team

## Common Questions

### Q: Can STAFF see each other's daily tasks?
**A:** No, STAFF members only see their own tasks in the main list. However, they can click any username to view that person's task history.

### Q: Why can STAFF view others' history?
**A:** This promotes transparency and collaboration. It's not meant to be secret - it's a team productivity tool.

### Q: Can managers see STAFF tasks in real-time?
**A:** Yes, managers and admins see all tasks by default, including real-time status updates.

### Q: What if I want completely private tasks?
**A:** The current system is designed for team transparency. If you need private tasks, consider:
- Using the description field for sensitive details (only you and admins see it)
- Creating tasks generically (e.g., "Client work" instead of client name)
- Discussing with your admin about permission changes

### Q: Can I hide my task history from other STAFF?
**A:** No, task history is visible to all users who click your name. This is by design for team transparency.

## Permission Matrix

| Action | STAFF | SUPERVISOR | MANAGER | ADMIN |
|--------|-------|------------|---------|-------|
| See own tasks | ✅ | ✅ | ✅ | ✅ |
| See all current tasks | ❌ | ❌ | ✅ | ✅ |
| View anyone's history | ✅ | ✅ | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ | ✅ | ✅ |
| Delete any task | ❌ | ❌ | ✅ | ✅ |
| See organization stats | ❌ | ❌ | ✅ | ✅ |
| Filter by user | ❌ | ❌ | ✅ | ✅ |

## Security Considerations

### ✅ Implemented
- Role-based access control at API level
- User ID validation (can only update own tasks)
- Session-based authentication
- Frontend permission checks

### 🔒 Defense in Depth
1. **API Level**: Server validates user role before returning data
2. **Database Level**: User ID is stored with each task
3. **Frontend Level**: UI conditionally renders based on permissions
4. **Session Level**: NextAuth ensures authenticated requests

## Customization Options

If you need to change visibility rules:

### Make Tasks Completely Private (STAFF can't view others' history)
**File:** `/src/app/tasks/page.tsx`
- Remove the username click handler
- Hide the clickable username links

### Allow SUPERVISORS to See Their Department's Tasks
**File:** `/src/app/api/tasks/route.ts`
- Add logic to check if user is SUPERVISOR
- Filter tasks by department ID
- Show only tasks from users in same department

### Make All Tasks Public to Everyone
**File:** `/src/app/api/tasks/route.ts`
- Remove the STAFF restriction (lines 26-27)
- All users will see all tasks

## Summary

The current implementation balances:
- **Privacy**: STAFF don't see each other's current work
- **Transparency**: Anyone can view historical task records
- **Management**: Admins/Managers have full visibility
- **Accountability**: Time tracking and history are transparent

This design promotes team collaboration while respecting individual privacy for day-to-day tasks.
