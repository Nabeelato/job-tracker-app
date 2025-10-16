# Daily Task Tracking Feature

## Overview
A comprehensive employee daily task tracking system with automatic time tracking and client assignment capabilities. Track activities like "Faizan Ali is punching invoices for NSA Communications" with precise time measurements.

## Features

### 1. **Task Creation**
- Create tasks with title, description, and optional client assignment
- Automatic user assignment from session
- UUID-based unique identifiers
- Timestamps for creation and updates

### 2. **Automatic Time Tracking**
- **PENDING → IN_PROGRESS**: Records `startedAt` timestamp
- **IN_PROGRESS → COMPLETED**: Records `completedAt` and automatically calculates `timeSpentMinutes`
- Formula: `timeSpentMinutes = (completedAt - startedAt) / 60000`
- Display format: "2h 15m" for better readability

### 3. **Client Assignment**
- Optional client name field for task association
- Filter tasks by client
- Client-based analytics showing task distribution

### 4. **Role-Based Permissions**
- **All Users (ADMIN, MANAGER, SUPERVISOR, STAFF)**:
  - Create own tasks
  - Mark own tasks as IN_PROGRESS or COMPLETED
  - View own task history
  
- **ADMIN & MANAGER Only**:
  - View all users' tasks
  - Filter by user
  - Delete any task
  - Access complete statistics across all users

### 5. **Statistics Dashboard**
- **Today**: Count of tasks created today
- **Pending**: Tasks awaiting action
- **Active**: Currently in-progress tasks
- **Done**: Completed tasks
- **Completion Rate**: Percentage calculation
- **Time Spent**: Total hours spent on completed tasks
- **Average Time**: Mean time per completed task
- **Tasks by Client**: Distribution across clients

### 6. **User History View**
- Click any username to view their complete task history
- Shows all tasks created by that user
- Includes time tracking and status information

## Database Schema

```prisma
model Task {
  id               String     @id
  title            String
  description      String?
  clientName       String?
  status           TaskStatus @default(PENDING)
  userId           String
  startedAt        DateTime?
  completedAt      DateTime?
  timeSpentMinutes Int?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime
  User             User       @relation("UserTasks", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([clientName])
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

## API Endpoints

### 1. GET `/api/tasks`
Fetch tasks with optional filters.

**Query Parameters:**
- `userId` (optional): Filter by specific user (Admin/Manager only)
- `status` (optional): Filter by PENDING, IN_PROGRESS, or COMPLETED
- `date` (optional): Filter by creation date (YYYY-MM-DD)
- `clientName` (optional): Filter by client name
- `showAll` (optional): Show all tasks for admins/managers

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Punching invoices for NSA Communications",
      "description": "Processing monthly invoices",
      "clientName": "NSA Communications",
      "status": "COMPLETED",
      "userId": "user-uuid",
      "startedAt": "2025-01-16T09:30:00Z",
      "completedAt": "2025-01-16T11:45:00Z",
      "timeSpentMinutes": 135,
      "createdAt": "2025-01-16T09:25:00Z",
      "updatedAt": "2025-01-16T11:45:00Z",
      "User": {
        "id": "user-uuid",
        "name": "Faizan Ali",
        "email": "faizan@example.com",
        "role": "STAFF"
      }
    }
  ]
}
```

### 2. POST `/api/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Punching invoices",
  "description": "Processing invoices for the month",
  "clientName": "NSA Communications"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Punching invoices",
  "status": "PENDING",
  "userId": "user-uuid",
  "createdAt": "2025-01-16T09:25:00Z"
}
```

### 3. PATCH `/api/tasks/[id]`
Update task status or details.

**Request Body (Status Change):**
```json
{
  "status": "IN_PROGRESS"
}
```

**Request Body (Edit Details):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "clientName": "New Client Name"
}
```

**Automatic Time Tracking:**
- Setting status to "IN_PROGRESS" → Records `startedAt`
- Setting status to "COMPLETED" → Records `completedAt` and calculates `timeSpentMinutes`

**Response:**
```json
{
  "id": "uuid",
  "title": "Punching invoices",
  "status": "IN_PROGRESS",
  "startedAt": "2025-01-16T09:30:00Z",
  "timeSpentMinutes": null
}
```

### 4. DELETE `/api/tasks/[id]`
Delete a task (Admin/Manager only).

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### 5. GET `/api/tasks/stats`
Get task statistics and analytics.

**Query Parameters:**
- `userId` (optional): Get stats for specific user

**Response:**
```json
{
  "total": 25,
  "pending": 5,
  "inProgress": 3,
  "completed": 17,
  "todayTotal": 8,
  "completionRate": 68,
  "totalTimeSpentMinutes": 2400,
  "totalTimeSpentHours": 40.0,
  "avgTimePerTaskMinutes": 141,
  "tasksByClient": [
    {
      "clientName": "NSA Communications",
      "count": 12
    },
    {
      "clientName": "ABC Corp",
      "count": 8
    }
  ]
}
```

## UI Components

### Task List (`/tasks`)
**Features:**
- Statistics cards at the top showing key metrics
- Filter controls (Status, Date, Client)
- Add task form with title, client, and description fields
- Task list with inline actions
- Time display in human-readable format
- User history access via username links

**Admin/Manager View:**
- Additional user filter dropdown
- "Show All" toggle for cross-user visibility
- Delete buttons on all tasks
- Complete statistics across organization

**Staff View:**
- Only own tasks visible by default
- Can view other users' history via username clicks
- Can only delete/complete own tasks

### Task Card Components
Each task displays:
- Title and description
- Client name (if assigned)
- Status badge (color-coded)
- Creator name (clickable for history)
- Creation timestamp
- Time spent (for completed tasks)
- Action buttons based on status and permissions

## Permission Matrix

| Action | STAFF | SUPERVISOR | MANAGER | ADMIN |
|--------|-------|------------|---------|-------|
| Create own tasks | ✅ | ✅ | ✅ | ✅ |
| View own tasks | ✅ | ✅ | ✅ | ✅ |
| View all tasks | ❌ | ❌ | ✅ | ✅ |
| View user history | ✅ | ✅ | ✅ | ✅ |
| Start own tasks | ✅ | ✅ | ✅ | ✅ |
| Complete own tasks | ✅ | ✅ | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ | ✅ | ✅ |
| Delete any task | ❌ | ❌ | ✅ | ✅ |
| View all stats | ❌ | ❌ | ✅ | ✅ |
| Filter by user | ❌ | ❌ | ✅ | ✅ |

## Time Tracking Logic

### State Transitions
```
PENDING ──────────────────> IN_PROGRESS ──────────────> COMPLETED
           (startedAt set)                  (completedAt set, 
                                            timeSpentMinutes calculated)
```

### Calculation Example
```javascript
// Task created at 09:25:00
// User clicks "Start" at 09:30:00 → startedAt = 09:30:00
// User clicks "Complete" at 11:45:00 → completedAt = 11:45:00

const timeSpentMinutes = (completedAt - startedAt) / 60000
// Result: 135 minutes (2h 15m)
```

### Display Formatting
```javascript
// 135 minutes → "2h 15m"
// 90 minutes → "1h 30m"
// 45 minutes → "45m"
```

## Usage Examples

### Example 1: Staff Member Tracking Daily Work
1. Faizan logs in as STAFF
2. Clicks "Add Task" on Tasks page
3. Fills in:
   - Title: "Punching invoices"
   - Client: "NSA Communications"
   - Description: "Processing monthly invoices"
4. Submits → Task created with status PENDING
5. Clicks "Start" → Status changes to IN_PROGRESS, startedAt recorded
6. Works on task for 2 hours 15 minutes
7. Clicks "Complete" → Status changes to COMPLETED, time automatically calculated
8. Dashboard shows task took 2h 15m

### Example 2: Manager Viewing Team Activity
1. Manager logs in
2. Navigates to Tasks page
3. Sees statistics for all team members:
   - 25 total tasks today
   - 68% completion rate
   - 40 hours total time spent
4. Uses user filter to view specific employee's tasks
5. Clicks on employee name to see full task history
6. Reviews time spent per task to identify efficiency

### Example 3: Client-Based Reporting
1. Admin wants to see all work for "NSA Communications"
2. Applies client filter
3. Views all tasks assigned to that client
4. Statistics show:
   - 12 tasks completed
   - Average time: 2h 20m per task
   - Total time: 28 hours billable

## Migration

The feature was added via Prisma migration:

```bash
npx prisma migrate dev --name add_daily_tasks_with_time_tracking
```

**Migration File:** `20251016103225_add_daily_tasks_with_time_tracking`

## Files Modified/Created

### New Files
- `/src/app/api/tasks/route.ts` - Main tasks API (GET, POST)
- `/src/app/api/tasks/[id]/route.ts` - Individual task operations (PATCH, DELETE)
- `/src/app/api/tasks/stats/route.ts` - Statistics and analytics API
- `/src/app/tasks/page.tsx` - Task management UI (~600 lines)

### Modified Files
- `/prisma/schema.prisma` - Added Task model and TaskStatus enum
- `/src/components/navbar.tsx` - Added Tasks navigation link

## Benefits

1. **Accountability**: Track exactly what employees are working on
2. **Time Management**: Automatic time tracking eliminates manual timers
3. **Productivity Insights**: Identify average task completion times
4. **Client Billing**: Track time spent per client for accurate invoicing
5. **Historical Records**: Complete audit trail of daily activities
6. **User-Friendly**: Simple interface with minimal clicks required

## Future Enhancements (Potential)

- Task categories/tags for better organization
- Recurring tasks (daily, weekly)
- Task templates for common activities
- Export to Excel for reporting
- Time range analytics (weekly, monthly trends)
- Task priorities (urgent, normal, low)
- Sub-tasks or checklist items
- Task comments/notes
- File attachments to tasks
- Mobile-responsive design optimization

## Testing

To test the feature:

1. **Create Tasks**:
   ```bash
   # Login as any user
   # Navigate to /tasks
   # Click "Add Task" and submit form
   ```

2. **Time Tracking**:
   ```bash
   # Create a task
   # Click "Start" (records startedAt)
   # Wait a few minutes
   # Click "Complete" (calculates time spent)
   # Verify time display shows correct duration
   ```

3. **Permissions**:
   ```bash
   # Login as STAFF
   # Verify can only see own tasks
   # Login as ADMIN
   # Verify can see all tasks and delete any
   ```

4. **Statistics**:
   ```bash
   # Create multiple tasks with different statuses
   # Check stats cards update correctly
   # Filter by client and verify counts
   ```

## Troubleshooting

### Issue: Tasks not showing
**Solution**: Check user role. STAFF users only see their own tasks by default. Use "Show All" filter or login as ADMIN/MANAGER.

### Issue: Time tracking not working
**Solution**: Ensure status transitions are: PENDING → IN_PROGRESS → COMPLETED. Skipping IN_PROGRESS will not record times.

### Issue: Cannot delete task
**Solution**: Only task creators or ADMIN/MANAGER roles can delete tasks. Check permissions.

### Issue: Statistics seem incorrect
**Solution**: Statistics only include tasks matching current filters. Clear all filters to see organization-wide stats.

## Support

For issues or questions about the daily task tracking feature, refer to:
- API endpoint documentation above
- Permission matrix for access control questions
- Database schema for data structure questions
