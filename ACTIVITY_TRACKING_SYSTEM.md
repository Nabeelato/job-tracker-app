# Activity Tracking & Reminder System

## Overview
This feature tracks all job activity and automatically reminds staff when jobs have been inactive for too long. The system excludes Sundays from time calculations and provides visual indicators for job status.

## Features

### 1. Activity Logging
All job-related actions are logged with timestamps:
- Job creation
- Assignment/reassignment
- Status changes
- Comments added
- File uploads
- Completion/cancellation
- Updates to job details

### 2. Business Hours Calculation
- Excludes Sundays from time calculations
- When a job has no activity on Sunday, the timer is paused
- Resumes counting on Monday

### 3. Automatic Reminders
- **24 hours**: Staff member receives in-app notification
- **48 hours**: Staff, supervisor, manager, and ALL admins receive urgent notifications
- Reminders only sent once per level unless job receives activity
- Viewing a job does NOT count as activity

### 4. Visual Indicators
Jobs are color-coded based on last activity:
- **Green border**: Active (< 24 business hours since last activity)
- **Yellow border**: Warning (24-48 business hours)
- **Red border**: Critical (> 48 business hours)

Color indicators appear on:
- Table view rows
- Grid view cards
- Monthly grouped views

### 5. Snooze Functionality
Users can snooze reminders for 24 business hours:
- Only assigned staff, supervisor, manager, or admin can snooze
- Snooze removes visual indicators temporarily
- Automatic reminders paused during snooze period

## API Endpoints

### Activity Logging (Internal)
```typescript
// All activity logging happens automatically via:
import { logJobCreated, logJobAssigned, logStatusChanged, logCommentAdded } from "@/lib/activity"

// Example:
await logJobCreated(jobId, userId, clientName)
await logCommentAdded(jobId, userId, userName)
```

### Snooze Reminders
```
POST /api/jobs/[id]/snooze
Authorization: Session required
Response: { success: true, snoozeUntil: "2025-10-09T12:00:00Z" }
```

### Unsnooze Reminders
```
DELETE /api/jobs/[id]/snooze
Authorization: Session required
Response: { success: true, message: "Reminders unsnoozed" }
```

### Cron Job (Automatic)
```
GET /api/cron/check-inactive-jobs
Authorization: Bearer {CRON_SECRET} (optional)
Schedule: Every hour (configured in vercel.json)
Response: { success: true, jobsChecked: 45, notificationsSent: 12 }
```

## Database Schema

### Activity Model
```prisma
model Activity {
  id          String       @id @default(cuid())
  jobId       String
  job         Job          @relation(fields: [jobId], references: [id], onDelete: Cascade)
  type        ActivityType
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  description String
  metadata    String?
  createdAt   DateTime     @default(now())

  @@index([jobId])
  @@index([userId])
}
```

### Job Model Additions
```prisma
model Job {
  // ... existing fields
  lastActivityAt       DateTime?
  lastReminderSentAt   DateTime?
  reminderSnoozeUntil  DateTime?
  activities           Activity[]
  
  @@index([lastActivityAt])
}
```

### ActivityType Enum
```prisma
enum ActivityType {
  CREATED
  ASSIGNED
  REASSIGNED
  STATUS_CHANGED
  COMMENT_ADDED
  FILE_UPLOADED
  COMPLETED
  CANCELLED
  UPDATED
  SNOOZED
}
```

### NotificationType Enum
```prisma
enum NotificationType {
  JOB_ASSIGNED
  JOB_REASSIGNED
  JOB_COMMENT
  JOB_STATUS_CHANGED
  JOB_COMPLETED
  JOB_OVERDUE
  JOB_INACTIVE_24H    // 24-hour inactivity reminder
  JOB_INACTIVE_48H    // 48-hour escalation
  MENTION
}
```

## Deployment

### Environment Variables
Add to `.env` (optional):
```bash
# Optional: Secret to secure cron endpoint
CRON_SECRET=your_random_secret_here
```

### Vercel Configuration
The `vercel.json` file configures automatic cron execution:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-inactive-jobs",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Manual Cron Trigger (Testing)
```bash
curl -X GET https://your-app.vercel.app/api/cron/check-inactive-jobs \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Usage Examples

### As a Staff Member
1. **Receive 24h reminder**: In-app notification appears
2. **Add activity**: Comment, update status, or upload file
3. **Snooze if needed**: Click snooze button to pause reminders for 24 business hours

### As a Supervisor/Admin
1. **Monitor job colors**: Red jobs need immediate attention
2. **Receive escalations**: At 48h, you're notified with staff
3. **Take action**: Reassign, comment, or contact staff member

### Visual Indicators
- Green rows = Everything is fine
- Yellow rows = Check in soon (24h passed)
- Red rows = URGENT - No activity for 48h
- No color = Job is snoozed or completed

## Business Logic

### What Counts as Activity?
✅ Adding a comment
✅ Changing job status
✅ Uploading a file
✅ Assigning/reassigning job
✅ Updating job details

❌ Viewing the job
❌ Reading comments
❌ Checking timeline

### Sunday Exclusion Example
- Job has activity on Friday 5 PM
- Saturday: 24 hours pass (counts)
- Sunday: All day (doesn't count)
- Monday 5 PM: 24-hour reminder triggers

### Reminder Frequency
- 24h reminder sent once
- If job gets activity, timer resets
- If no activity, 48h reminder sent to everyone
- 48h reminder can send again after 24h if still no activity

## Troubleshooting

### Reminders Not Sending
1. Check Vercel cron is configured
2. Verify `vercel.json` is deployed
3. Check logs: Vercel Dashboard → Functions → check-inactive-jobs

### Colors Not Showing
1. Ensure `lastActivityAt` is set on jobs
2. Migration may need to be run: `npx prisma migrate deploy`
3. Check browser console for errors

### Snooze Not Working
1. Verify user has permission (assigned to job)
2. Check `reminderSnoozeUntil` is being saved
3. Confirm date calculation excludes Sundays

## Future Enhancements
- [ ] Email notifications (currently in-app only)
- [ ] Custom snooze durations
- [ ] Activity timeline view on job detail page
- [ ] Bulk snooze for multiple jobs
- [ ] Weekly summary reports for managers

## Technical Notes

### Performance
- Cron job queries all active jobs (efficient with proper indexing)
- Activity logging uses transactions (atomic updates)
- Visual indicators calculated on-the-fly (no database queries)

### Scalability
- For 1000+ active jobs, consider:
  - Database query optimization
  - Caching activity status
  - Batch notification creation

### Testing
To manually test the system:
1. Create a job
2. Manually set `lastActivityAt` to 25 hours ago
3. Trigger cron: `curl /api/cron/check-inactive-jobs`
4. Check notifications in database or UI
