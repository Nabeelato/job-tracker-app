# Quick Integration Guide

## How to Add Features to Job Detail Page

### 1. Add Progress Tracker to Job Detail Page

**File:** `src/app/jobs/[id]/page.tsx`

Add this import at the top:
```typescript
import ProgressTracker from "@/components/progress-tracker";
```

Add `progress` to the Job interface (around line 40):
```typescript
interface Job {
  // ... existing fields
  progress: number; // ADD THIS
}
```

Add this component in the JSX (after job status section, around line 400):
```tsx
{/* Progress Tracker */}
<ProgressTracker
  jobId={job.id}
  currentProgress={job.progress || 0}
  onUpdate={(newProgress) => {
    setJob((prev) => (prev ? { ...prev, progress: newProgress } : null));
  }}
  canUpdate={session?.user.id === job.assignedTo.id}
/>
```

### 2. Enable @Mentions in Comments

**Current State:** Backend is ready! Mentions are automatically detected and users are notified.

**Format for mentions:**
```
@[John Doe](userId123)
```

**To Add Autocomplete (Optional):**

Create a mention input component with dropdown suggestions:
```typescript
// Get team members
const teamMembers = await getJobTeamMembers(jobId);

// Show dropdown when user types '@'
// Select user and insert: @[Name](userId)
```

### 3. Add Comment Field to Status Changes

**File:** `src/app/jobs/[id]/page.tsx`

When changing status, add a textarea for optional comment:

```tsx
<textarea
  value={statusComment}
  onChange={(e) => setStatusComment(e.target.value)}
  placeholder="Why are you changing the status? (optional)"
  className="w-full p-2 border rounded"
/>
```

Then include it in the API call:
```typescript
await fetch(`/api/jobs/${id}/status`, {
  method: "PATCH",
  body: JSON.stringify({
    status: newStatus,
    comment: statusComment, // NEW
  }),
});
```

### 4. Testing Notifications

**Test Real-Time Notifications:**
1. Open app in two browsers (different users)
2. User A comments on a job
3. User B should see notification bell update within 30 seconds
4. Click bell to see notification
5. Click notification to go to job

**Test @Mentions:**
1. Add a comment with mention: "Hey @[Manager Name](managerId), please review this"
2. Mentioned user gets priority notification
3. Notification type shows as "COMMENT_MENTION"

**Test Progress Updates:**
1. As assigned staff, update progress to 50%
2. Manager/Supervisor gets notification
3. Update to 100%
4. Another notification sent
5. Progress shown in job timeline

---

## Quick Command Reference

```bash
# Run database migrations
npx prisma db push
npx prisma generate

# Start development server
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint
```

---

## Notification Types Reference

Use these when creating custom notifications:

```typescript
- "JOB_ASSIGNED" - Job assignment
- "COMMENT_MENTION" - User mentioned
- "COMMENT_ADDED" - New comment
- "STATUS_CHANGE" - Status updated
- "PROGRESS_UPDATE" - Progress milestone
- "DUE_DATE_REMINDER" - Deadline approaching
- "JOB_COMPLETED" - Job finished
- "JOB_URGENT" - Urgent job
```

---

## Common Tasks

### Create a Notification Manually
```typescript
import { createNotification } from "@/lib/notifications";

await createNotification({
  userId: "user123",
  type: "CUSTOM",
  title: "Important Update",
  content: "Something happened that you should know about",
  jobId: "job456",
  actionUrl: "/jobs/job456",
});
```

### Extract Mentions from Text
```typescript
import { extractMentions } from "@/lib/notifications";

const mentions = extractMentions("@[John](id1) and @[Jane](id2)");
// Returns: ["id1", "id2"]
```

### Get Job Team Members
```typescript
import { getJobTeamMembers } from "@/lib/notifications";

const members = await getJobTeamMembers(jobId);
// Returns: Array of users involved in the job
```

---

## Next Steps

1. ✅ **Notifications Working** - Test in production
2. ✅ **Progress Tracker** - Add to job detail page
3. ⏳ **@Mention UI** - Add autocomplete dropdown (optional)
4. ⏳ **File Upload** - Implement next phase
5. ⏳ **Status Comment UI** - Add textarea to status change

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check API route logs
3. Verify database schema is up to date
4. Ensure Prisma client is regenerated

```bash
# Reset if needed
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed
```
