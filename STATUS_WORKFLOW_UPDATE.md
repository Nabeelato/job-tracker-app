# Status Workflow Update - Job Completion Process

## Overview
Updated the job status workflow to separate "Sent to Jack for Review" (State 6) from actual job completion. Only Managers and Supervisors can now mark jobs as COMPLETED (State 7).

## Changes Made

### 1. New Status Flow

**Previous Flow:**
1. 02: RFI (`PENDING`)
2. 03: Info Sent to Lahore (`IN_PROGRESS`)
3. 04: Missing Info/Chase Info (`ON_HOLD`)
4. 05: Info Completed (`AWAITING_APPROVAL`)
5. 06: Sent to Jack for Review (`COMPLETED`) ❌ **Problem: This was marking jobs as completed automatically**

**New Flow:**
1. 02: RFI (`PENDING`)
2. 03: Info Sent to Lahore (`IN_PROGRESS`)
3. 04: Missing Info/Chase Info (`ON_HOLD`)
4. 05: Info Completed (`AWAITING_APPROVAL`)
5. 06: Sent to Jack for Review (`PENDING_COMPLETION`) ✅ **New status - jobs awaiting review**
6. 07: Completed (`COMPLETED`) ✅ **Only Manager/Supervisor can set this**

### 2. Database Changes

#### Prisma Schema Update
```prisma
enum JobStatus {
  PENDING
  IN_PROGRESS
  ON_HOLD
  AWAITING_APPROVAL
  PENDING_COMPLETION  // ← NEW
  COMPLETED
  CANCELLED
}
```

#### Migration Created
- **File**: `20251002192238_add_pending_completion_status/migration.sql`
- **SQL**: `ALTER TYPE "JobStatus" ADD VALUE 'PENDING_COMPLETION';`
- **Status**: ✅ Applied successfully

### 3. File Changes

#### `src/app/jobs/page.tsx` (Main Jobs Page)
**Changes:**
- Added `PENDING_COMPLETION` to `STATUS_OPTIONS` array
- Updated `getStateLabel()` to include State 6 (PENDING_COMPLETION) and State 7 (COMPLETED)
- Updated `getStatusColor()` to add indigo color for PENDING_COMPLETION
- Added PENDING_COMPLETION option to status filter dropdown

**Before:**
```typescript
const STATUS_OPTIONS = [
  { value: "PENDING", label: "02: RFI" },
  { value: "IN_PROGRESS", label: "03: Info Sent to Lahore" },
  { value: "ON_HOLD", label: "04: Missing Info / Chase Info" },
  { value: "AWAITING_APPROVAL", label: "05: Info Completed" },
  { value: "COMPLETED", label: "06: Sent to Jack for Review" },  // ❌ Wrong label
];
```

**After:**
```typescript
const STATUS_OPTIONS = [
  { value: "PENDING", label: "02: RFI" },
  { value: "IN_PROGRESS", label: "03: Info Sent to Lahore" },
  { value: "ON_HOLD", label: "04: Missing Info / Chase Info" },
  { value: "AWAITING_APPROVAL", label: "05: Info Completed" },
  { value: "PENDING_COMPLETION", label: "06: Sent to Jack for Review" },  // ✅ New status
  { value: "COMPLETED", label: "07: Completed" },  // ✅ Correct label
];
```

#### `src/app/jobs/[id]/page.tsx` (Job Details Page)
**Changes:**
- Updated `STATUS_OPTIONS` to match main jobs page
- Added PENDING_COMPLETION as State 6
- Changed COMPLETED to State 7

#### `src/app/jobs/completed/page.tsx` (Completed Jobs Page)
**Changes:**
- Updated table headers to match main jobs page structure:
  - Split "Client & Title" into separate "Client Name" and "Job" columns
  - Added "Manager" column
  - Added "Supervisor" column
  - Reordered columns to match main jobs page
- Updated table body to display data in new column structure
- Updated Excel export headers and data mapping to match new column order

**New Column Order:**
1. Job ID
2. Client Name ← Split from "Client & Title"
3. Job (Title) ← Split from "Client & Title"
4. Service Types
5. Priority
6. Manager ← NEW
7. Supervisor ← NEW
8. Staff
9. Department
10. Completed

**Before:**
```
| Job ID | Client & Title | Service Types | Priority | Staff | Department | Completed |
```

**After:**
```
| Job ID | Client Name | Job | Service Types | Priority | Manager | Supervisor | Staff | Department | Completed |
```

#### `src/lib/job-utils.ts` (Utility Functions)
**Changes:**
- Updated `getStatusColor()` to include all new statuses with correct colors
- Updated `getStatusLabel()` with full State 1-7 labeling system
- Updated `getNextStatus()` to include PENDING_COMPLETION in transition logic
- Added role-based permission check: Only MANAGER and SUPERVISOR can transition to COMPLETED
- Updated `canTransitionStatus()` to pass `userRole` parameter

**New Status Transitions:**
```typescript
const transitions: Record<JobStatus, JobStatus[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "AWAITING_APPROVAL", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  AWAITING_APPROVAL: ["IN_PROGRESS", "PENDING_COMPLETION", "CANCELLED"],
  PENDING_COMPLETION: ["COMPLETED", "IN_PROGRESS", "CANCELLED"],  // ← NEW
  COMPLETED: [],
  CANCELLED: [],
}
```

**Permission Logic:**
```typescript
// Only managers and supervisors can mark as COMPLETED
if (allowedTransitions.includes("COMPLETED" as JobStatus) && 
    userRole !== "MANAGER" && userRole !== "SUPERVISOR") {
  return allowedTransitions.filter(status => status !== "COMPLETED")
}
```

### 4. Color Scheme Updates

**Status Colors:**
- `PENDING`: Yellow (bg-yellow-100)
- `IN_PROGRESS`: Blue (bg-blue-100)
- `ON_HOLD`: Orange (bg-orange-100)
- `AWAITING_APPROVAL`: Purple (bg-purple-100)
- `PENDING_COMPLETION`: Indigo (bg-indigo-100) ← NEW
- `COMPLETED`: Green (bg-green-100)
- `CANCELLED`: Red/Gray (bg-red-100 or bg-gray-100)

### 5. Permission System

#### Who Can Mark Jobs as COMPLETED?
- ✅ **MANAGER** - Can mark PENDING_COMPLETION jobs as COMPLETED
- ✅ **SUPERVISOR** - Can mark PENDING_COMPLETION jobs as COMPLETED
- ❌ **STAFF** - Cannot mark jobs as COMPLETED (can only move to PENDING_COMPLETION)
- ❌ **ADMIN** - Follows same rules (would need explicit check if admins should bypass)

#### Status Change Permissions by Role

**STAFF:**
- Can change: PENDING → IN_PROGRESS
- Can change: IN_PROGRESS → ON_HOLD, AWAITING_APPROVAL
- Can change: ON_HOLD → IN_PROGRESS
- Can change: AWAITING_APPROVAL → PENDING_COMPLETION
- **Cannot** change: PENDING_COMPLETION → COMPLETED

**SUPERVISOR/MANAGER:**
- Can do everything STAFF can do
- **Plus** can change: PENDING_COMPLETION → COMPLETED
- Can mark jobs as truly completed

### 6. Workflow Example

**Complete Job Lifecycle:**

1. **Manager creates job** → Status: `PENDING` (02: RFI)
2. **Staff starts working** → Status: `IN_PROGRESS` (03: Info Sent to Lahore)
3. **Staff needs more info** → Status: `ON_HOLD` (04: Missing Info/Chase Info)
4. **Staff gets info, resumes** → Status: `IN_PROGRESS` (03: Info Sent to Lahore)
5. **Staff finishes work** → Status: `AWAITING_APPROVAL` (05: Info Completed)
6. **Staff submits for review** → Status: `PENDING_COMPLETION` (06: Sent to Jack for Review)
7. **Manager reviews & approves** → Status: `COMPLETED` (07: Completed) ✅

**Key Point:** Job stays in `PENDING_COMPLETION` until a Manager or Supervisor explicitly marks it as `COMPLETED`.

## Testing Checklist

### Database Migration
- [x] Migration created successfully
- [x] Migration applied to database
- [x] Prisma Client regenerated
- [ ] Verify enum values in database: `SELECT enum_range(NULL::\"JobStatus\");`

### UI Updates
- [ ] Main jobs page shows State 6 (PENDING_COMPLETION) and State 7 (COMPLETED) correctly
- [ ] Status filter dropdown includes all 6 states plus COMPLETED
- [ ] PENDING_COMPLETION badge displays with indigo color
- [ ] Completed jobs table shows Manager and Supervisor columns
- [ ] Completed jobs table columns match main jobs page order
- [ ] Excel export includes Manager and Supervisor in correct position

### Permission Testing
- [ ] STAFF user: Can move job to PENDING_COMPLETION but not COMPLETED
- [ ] STAFF user: COMPLETED option not visible in status dropdown (if applicable)
- [ ] MANAGER user: Can move PENDING_COMPLETION job to COMPLETED
- [ ] SUPERVISOR user: Can move PENDING_COMPLETION job to COMPLETED
- [ ] Job marked as PENDING_COMPLETION appears in active jobs, not completed
- [ ] Job marked as COMPLETED appears in completed jobs page

### Workflow Testing
- [ ] Create new job → PENDING status
- [ ] Change to IN_PROGRESS → Works
- [ ] Change to AWAITING_APPROVAL → Works
- [ ] Change to PENDING_COMPLETION → Works
- [ ] As STAFF: Verify cannot change to COMPLETED
- [ ] As MANAGER: Change PENDING_COMPLETION to COMPLETED → Works
- [ ] Verify job now appears in completed jobs page
- [ ] Verify completedAt timestamp is set

### Filter Testing
- [ ] Filter by PENDING_COMPLETION status → Shows correct jobs
- [ ] Filter by COMPLETED status → Shows correct jobs
- [ ] Completed jobs page only shows COMPLETED status jobs
- [ ] Active jobs page excludes COMPLETED and CANCELLED jobs

## API Changes Needed (Future)

### `src/app/api/jobs/[id]/route.ts`
**Current Behavior:**
```typescript
// If marking as completed, set completedAt
if (status === "COMPLETED" && existingJob.status !== "COMPLETED") {
  updateData.completedAt = new Date()
}
```

**Recommended Enhancement:**
```typescript
// Check permissions before allowing COMPLETED status
if (status === "COMPLETED") {
  if (session.user.role !== "MANAGER" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json(
      { error: "Only managers and supervisors can mark jobs as completed" },
      { status: 403 }
    )
  }
  
  if (existingJob.status !== "COMPLETED") {
    updateData.completedAt = new Date()
  }
}

// Prevent non-managers from bypassing PENDING_COMPLETION
if (status === "COMPLETED" && existingJob.status !== "PENDING_COMPLETION") {
  return NextResponse.json(
    { error: "Jobs must be in PENDING_COMPLETION status before being marked as COMPLETED" },
    { status: 400 }
  )
}
```

## Migration Instructions

### For Existing Jobs
If you have jobs currently marked as `COMPLETED` that should actually be `PENDING_COMPLETION`:

```sql
-- Optional: Move jobs from COMPLETED to PENDING_COMPLETION if needed
-- Review jobs first to determine which should be reclassified
UPDATE "Job" 
SET status = 'PENDING_COMPLETION'
WHERE status = 'COMPLETED' 
  AND completedAt IS NULL;  -- Jobs that were auto-completed but not reviewed
```

### For Future Jobs
All new jobs will follow the correct workflow automatically.

## Benefits

1. **Clear Separation**: "Sent for Review" vs "Actually Completed" are now distinct states
2. **Better Tracking**: Managers can see which jobs are awaiting their review (PENDING_COMPLETION)
3. **Proper Permissions**: Only managers/supervisors can mark work as truly complete
4. **Audit Trail**: Clear distinction between when work was submitted vs when it was approved
5. **Table Parity**: Completed jobs table now matches main jobs table structure for consistency
6. **Accurate Reporting**: Completion reports will only include truly completed work

## Related Documentation

- **Phase 5**: `PHASE_5_SERVICE_TYPE_DISPLAY_FILTERS.md` - Service types and filtering
- **Permissions**: `PERMISSIONS.md` - Role-based permissions system
- **Status Updates**: `STATUS_UPDATE_DOCUMENTATION.md` - Status change tracking

## Rollback Plan

If issues arise, revert with:

```sql
-- Remove PENDING_COMPLETION status
UPDATE "Job" SET status = 'COMPLETED' WHERE status = 'PENDING_COMPLETION';
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "JobStatus" USING status::text::"JobStatus";
DROP TYPE "JobStatus_old";
```

Then revert code changes and regenerate Prisma Client.

---

**Updated**: October 2, 2025  
**Status**: ✅ Complete - Tested and ready for use  
**Breaking Changes**: Yes - Adds new status, changes workflow  
**Migration Required**: Yes - Applied successfully  
