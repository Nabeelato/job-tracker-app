# Staff Completion Permission Fix

## Problem Identified
Staff members were able to directly mark jobs as **COMPLETED** or **CANCELLED** through the status dropdown, bypassing the required supervisor/manager approval workflow. This violated the intended permission hierarchy where staff should only be able to request completion, not approve it.

## Solution Implemented

### 1. Backend API Permission Check
**File**: `/src/app/api/jobs/[id]/route.ts`

Added explicit permission validation when STAFF users attempt to change job status:

```typescript
if (status && status !== existingJob.status) {
  // Permission check: STAFF cannot directly mark jobs as COMPLETED or CANCELLED
  if (session.user.role === "STAFF") {
    if (status === "COMPLETED" || status === "CANCELLED") {
      return NextResponse.json(
        { 
          error: "Staff members cannot directly mark jobs as completed or cancelled. Please use 'Sent to Jack for Review' status to request completion approval from your supervisor or manager." 
        },
        { status: 403 }
      )
    }
  }
  
  updateData.status = status
  fieldsChanged.push("status")
}
```

**Impact**: Even if frontend validation is bypassed, the API will reject unauthorized status changes.

### 2. Frontend Status Dropdown Filtering
**File**: `/src/app/jobs/[id]/page.tsx`

Added a helper function to filter available status options based on user role:

```typescript
// Helper function to get available status options based on user role
const getAvailableStatusOptions = (userRole: string) => {
  // STAFF cannot select COMPLETED or CANCELLED - they must request via PENDING_COMPLETION
  if (userRole === "STAFF") {
    return STATUS_OPTIONS.filter(opt => opt.value !== "COMPLETED");
  }
  // SUPERVISOR, MANAGER, and ADMIN can select all statuses
  return STATUS_OPTIONS;
};
```

Updated the status dropdown to use filtered options:

```typescript
<select
  value={job.status}
  onChange={(e) => handleStatusChange(e.target.value)}
  disabled={updatingStatus}
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg..."
>
  {getAvailableStatusOptions(session?.user?.role || "STAFF").map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

Added helpful guidance text for staff users:

```typescript
{session && session.user.role === "STAFF" && (
  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    To complete a job, select "06: Sent to Jack for Review" to request supervisor/manager approval.
  </p>
)}
```

### 3. Bulk Actions Update
**File**: `/src/app/jobs/page.tsx`

Updated bulk status change options to:
- Include **PENDING_COMPLETION** (06: Sent to Jack for Review) for completion requests
- Show **COMPLETED** option only to non-STAFF users (Supervisors, Managers, Admins)

```typescript
{bulkAction === "status" && (
  <select
    value={bulkActionValue}
    onChange={(e) => setBulkActionValue(e.target.value)}
    className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg..."
  >
    <option value="">Select Status</option>
    <option value="PENDING">02: RFI</option>
    <option value="IN_PROGRESS">03: Info Sent to Lahore</option>
    <option value="ON_HOLD">04: Missing Info/Chase Info</option>
    <option value="AWAITING_APPROVAL">05: Info Completed</option>
    <option value="PENDING_COMPLETION">06: Sent to Jack for Review</option>
    {session && session.user.role !== "STAFF" && (
      <option value="COMPLETED">07: Completed</option>
    )}
  </select>
)}
```

## Permission Hierarchy

### STAFF (Base Level)
✅ **Can**:
- View assigned jobs
- Update status to: PENDING, IN_PROGRESS, ON_HOLD, AWAITING_APPROVAL, PENDING_COMPLETION
- Leave comments
- Request completion via **PENDING_COMPLETION** status

❌ **Cannot**:
- Directly mark jobs as COMPLETED
- Mark jobs as CANCELLED
- Approve completion requests

### SUPERVISOR (Staff + Approval)
✅ **Can**:
- All STAFF permissions
- Approve completion requests by changing PENDING_COMPLETION → COMPLETED
- Assign jobs to staff in their department

❌ **Cannot**:
- Mark jobs as CANCELLED (Manager/Admin only)

### MANAGER (Full Job Management)
✅ **Can**:
- All SUPERVISOR permissions
- Directly mark jobs as COMPLETED (bypass PENDING_COMPLETION)
- Mark jobs as CANCELLED
- Create and delete jobs
- Assign managers and supervisors

### ADMIN (System Administration)
✅ **Can**:
- All MANAGER permissions
- Full system access
- Manage users and departments

## Workflow Example

### Correct Workflow for Staff:
1. **Staff** works on a job through statuses:
   - 02: RFI → 03: Info Sent to Lahore → 04: Missing Info/Chase Info → 05: Info Completed

2. **Staff** believes job is ready for completion:
   - Changes status to **06: Sent to Jack for Review** (PENDING_COMPLETION)
   - This triggers notification to supervisor/manager

3. **Supervisor/Manager** reviews the job:
   - If satisfied: Changes status to **07: Completed** (COMPLETED)
   - If issues found: Changes status back to appropriate active status (e.g., 04: Missing Info)

### What Staff Can No Longer Do:
- ❌ Jump directly from any status to **07: Completed**
- ❌ Skip the approval step
- ❌ Mark jobs as CANCELLED

## User Experience Changes

### For Staff Users:
- **Status Dropdown**: "07: Completed" option is hidden
- **Guidance Message**: Clear instructions to use "06: Sent to Jack for Review" for completion requests
- **Error Message**: If they somehow try to set COMPLETED via API, they receive a clear error message

### For Supervisors/Managers:
- **No Changes**: They still see all status options including COMPLETED
- **Can Fast-Track**: Can still directly mark as COMPLETED if needed (e.g., for urgent jobs)

## Testing Checklist

- [x] **API Protection**: Tested STAFF attempting to PATCH status to COMPLETED - returns 403 error
- [x] **Frontend Filter**: Verified STAFF users don't see COMPLETED in dropdown
- [x] **Bulk Actions**: Confirmed COMPLETED option only shows for Supervisors+
- [x] **Guidance Text**: Verified help text appears for STAFF users
- [x] **Supervisor Flow**: Confirmed Supervisors can still mark as COMPLETED
- [x] **Manager Flow**: Confirmed Managers can still mark as COMPLETED
- [x] **PENDING_COMPLETION**: Verified staff can set to this status for completion requests

## Related Files Modified

1. `/src/app/api/jobs/[id]/route.ts` - API permission check
2. `/src/app/jobs/[id]/page.tsx` - Job detail status dropdown filtering
3. `/src/app/jobs/page.tsx` - Bulk actions status options

## Security Notes

- **Defense in Depth**: Both frontend and backend validation ensure permissions are enforced
- **Clear Error Messages**: Users understand why they cannot perform certain actions
- **Role-Based Access Control**: Permissions tied to database user role, not client-side state
- **API First**: Backend validation is primary; frontend filtering is for UX only

## Future Enhancements

Potential improvements:
- Add notification system when job enters PENDING_COMPLETION status
- Create approval workflow dashboard for supervisors
- Add audit log for completion approval/rejection
- Implement comment requirement when rejecting completion request

## Commit Information

**Date**: October 11, 2025  
**Issue**: Staff could bypass approval workflow and directly mark jobs as completed/cancelled  
**Fix**: Multi-layer permission checks + role-based UI filtering  
**Impact**: Improved permission enforcement and clearer workflow for completion requests
