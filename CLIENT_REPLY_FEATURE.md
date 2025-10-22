# Client Reply Tracking Feature

## Overview
Added the ability to track when jobs are awaiting client replies. When marked as "awaiting client reply", the job card/row displays a blue background, making it easy to identify jobs that are blocked waiting for client input.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `awaitingClientReply Boolean @default(false)` field to the `Job` model
- Migration: `20251022100101_add_awaiting_client_reply`

### 2. API Endpoint
**New File:** `/src/app/api/jobs/[id]/client-reply/route.ts`
- POST endpoint accepting `{ action: "awaiting" | "received" }`
- Updates the `awaitingClientReply` field in the database
- Creates timeline entries with actions:
  - `AWAITING_CLIENT_REPLY` - when marked as awaiting
  - `CLIENT_REPLY_RECEIVED` - when reply is received

### 3. UI Updates (`src/app/jobs/page.tsx`)

#### Background Colors
- **Grid View**: Blue background (`bg-blue-50/50`) when `awaitingClientReply === true`
- **Table View**: Blue row color with left border when awaiting client reply
- **Priority Logic**: Blue background overrides time-based colors (green/yellow/red)
- **Restoration**: When reply is received, returns to normal time-based color coding

#### Action Buttons
Added two conditional buttons in the expanded job view:
1. **"Awaiting Reply"** button (sky blue, Mail icon)
   - Shows when job is NOT awaiting client reply
   - Marks job as awaiting client input
   
2. **"Reply Received"** button (emerald green, MailCheck icon)
   - Shows when job IS awaiting client reply
   - Marks reply as received and restores normal status

#### Timeline Integration
- Mail icon (sky background) for "marked as awaiting client reply"
- MailCheck icon (emerald background) for "marked reply as received"
- Timeline entries show who performed the action and when

### 4. New Icons
Imported from `lucide-react`:
- `Mail` - for awaiting client reply
- `MailCheck` - for reply received

## Usage

### Marking a Job as Awaiting Client Reply
1. Expand any active job (not completed or cancelled)
2. Click the **"Awaiting Reply"** button
3. Job background turns blue across both grid and table views
4. Timeline shows the event with timestamp

### Marking Reply as Received
1. Find a job with blue background (awaiting reply)
2. Expand the job
3. Click the **"Reply Received"** button
4. Job background returns to time-based color (green/yellow/red/gray)
5. Timeline shows the received event

## Visual Indicators

### Blue = Awaiting Client Reply
- Indicates job is blocked waiting for client input
- Helps prioritize follow-ups
- Makes it easy to see client-dependent tasks at a glance

### Time-Based Colors (when not awaiting)
- **Green**: Recent activity (within 2 business days)
- **Yellow**: Warning (2-3 business days since activity)
- **Red**: Critical (>3 business days since activity)
- **Gray**: Snoozed or normal

## Technical Notes

### Type Safety
- Updated `Job` interface with `awaitingClientReply?: boolean`
- TypeScript types automatically generated via Prisma

### Permission Handling
- Buttons only show for active jobs (not completed/cancelled)
- All roles can mark client reply status
- Timeline tracks who performed each action

### Color Priority
1. Completed/Cancelled jobs: No color indicator
2. Awaiting Client Reply: Blue (overrides all)
3. Time-based activity status: Green/Yellow/Red
4. Snoozed: Gray/Normal

## Testing Checklist

- [x] Database migration applied successfully
- [x] API endpoint created and functional
- [x] Grid view shows blue background when awaiting
- [x] Table view shows blue row when awaiting
- [x] "Awaiting Reply" button works and updates UI
- [x] "Reply Received" button works and restores colors
- [x] Timeline shows both event types correctly
- [x] No TypeScript errors
- [x] Dev server running successfully

## Next Steps
1. Test end-to-end workflow with actual jobs
2. Verify timeline events persist after refresh
3. Check mobile responsiveness of new buttons
4. Consider adding email notifications when marked as awaiting
5. Add bulk action for marking multiple jobs as awaiting reply
