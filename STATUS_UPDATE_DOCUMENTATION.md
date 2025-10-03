# Status Update System - Complete Documentation

## 📊 **How Status Updates Work - Full Flow**

### **1. Frontend UI (Job Detail Page)**

**File:** `src/app/jobs/[id]/page.tsx`

#### **Status Dropdown Section (Lines 466-486):**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
    Update Status
  </h3>
  <select
    value={job.status}
    onChange={(e) => handleStatusChange(e.target.value)}
    disabled={updatingStatus}
    className="w-full px-4 py-2 border ..."
  >
    {STATUS_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
  {session && needsApprovalToComplete(session.user.role) && (
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Marking as completed will require approval
    </p>
  )}
</div>
```

#### **Status Options (Lines 90-96):**
```tsx
const STATUS_OPTIONS = [
  { value: "PENDING", label: "02: RFI" },
  { value: "IN_PROGRESS", label: "03: Info Sent to Lahore" },
  { value: "ON_HOLD", label: "04: Missing Info / Chase Info" },
  { value: "AWAITING_APPROVAL", label: "05: Info Completed" },
  { value: "COMPLETED", label: "06: Sent to Jack for Review" },
];
```

#### **Handler Function (Lines 134-163):**
```tsx
const handleStatusChange = async (newStatus: string) => {
  if (!session) return;

  // Check if user needs approval for completion
  const needsApproval = needsApprovalToComplete(session.user.role);
  const actualStatus = needsApproval && newStatus === "COMPLETED" 
    ? "AWAITING_APPROVAL"  // Staff can only request approval
    : newStatus;

  setUpdatingStatus(true);
  try {
    // Send PATCH request to API
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: actualStatus }),
    });

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    // Refresh job data to show new status
    await fetchJob();
  } catch (error: any) {
    setError(error.message || "An error occurred");
  } finally {
    setUpdatingStatus(false);
  }
};
```

---

### **2. Backend API (Status Update Endpoint)**

**File:** `src/app/api/jobs/[id]/route.ts`

#### **PATCH Endpoint (Lines 95-193):**

**Step 1: Authentication & User Lookup**
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Get actual database user by email
const dbUser = await prisma.user.findUnique({
  where: { email: session.user.email },
})
```

**Step 2: Parse Request & Get Existing Job**
```typescript
const body = await request.json()
const { title, description, priority, dueDate, status, tags } = body

const existingJob = await prisma.job.findUnique({
  where: { id: params.id },
})
```

**Step 3: Permission Check**
```typescript
const isEditingDetails = title || description || priority || dueDate || tags
if (isEditingDetails && !canEditJobDetails(session.user.role)) {
  return NextResponse.json(
    { error: "You don't have permission to edit job details" },
    { status: 403 }
  )
}
```

**Step 4: Build Update Data**
```typescript
const updateData: any = {}
if (title) updateData.title = title
if (description) updateData.description = description
if (priority) updateData.priority = priority
if (dueDate) updateData.dueDate = new Date(dueDate)
if (tags) updateData.tags = tags
if (status) updateData.status = status

// If marking as completed, set completedAt timestamp
if (status === "COMPLETED" && existingJob.status !== "COMPLETED") {
  updateData.completedAt = new Date()
}
```

**Step 5: Update Job in Database**
```typescript
const updatedJob = await prisma.job.update({
  where: { id: params.id },
  data: updateData,
  include: {
    assignedTo: true,
    assignedBy: true,
    department: true,
  },
})
```

**Step 6: Create Timeline Entry**
```typescript
if (status && status !== existingJob.status) {
  // Create StatusUpdate record for timeline
  await prisma.statusUpdate.create({
    data: {
      jobId: params.id,
      userId: dbUser.id,
      action: "STATUS_CHANGED",
      oldValue: existingJob.status,
      newValue: status,
    },
  })

  // Send notification to assigned user
  if (existingJob.assignedToId !== dbUser.id) {
    await prisma.notification.create({
      data: {
        userId: existingJob.assignedToId,
        type: "STATUS_CHANGED",
        title: "Job status updated",
        content: `"${existingJob.title}" status changed to ${status}`,
        jobId: params.id,
      },
    })
  }
}
```

---

### **3. Database Schema**

**File:** `prisma/schema.prisma`

#### **Job Model:**
```prisma
model Job {
  id           String      @id @default(cuid())
  status       JobStatus   @default(PENDING)
  completedAt  DateTime?
  // ... other fields
  
  statusUpdates StatusUpdate[]  // One-to-many relation
}

enum JobStatus {
  PENDING
  IN_PROGRESS
  ON_HOLD
  AWAITING_APPROVAL
  COMPLETED
  CANCELLED
}
```

#### **StatusUpdate Model:**
```prisma
model StatusUpdate {
  id        String   @id @default(cuid())
  jobId     String
  userId    String
  action    String
  oldValue  String?
  newValue  String?
  timestamp DateTime @default(now())

  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])
}
```

---

### **4. Permission System**

**File:** `src/lib/permissions.ts`

```typescript
export function needsApprovalToComplete(role: UserRole): boolean {
  return role === "STAFF"
}

export function canEditJobDetails(role: UserRole): boolean {
  return ["ADMIN", "MANAGER"].includes(role)
}
```

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Select new status from dropdown                    │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: handleStatusChange()                                  │
│  1. Check if user needs approval (Staff only)                   │
│  2. Convert COMPLETED → AWAITING_APPROVAL for Staff             │
│  3. Send PATCH request to /api/jobs/[id]                        │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND: PATCH /api/jobs/[id]                                   │
│  1. ✅ Authenticate user                                         │
│  2. 🔍 Get database user by email                               │
│  3. 📋 Fetch existing job                                        │
│  4. 🔒 Check permissions                                         │
│  5. 💾 Update job status in database                            │
│  6. 📝 Create StatusUpdate record (timeline)                    │
│  7. 🔔 Create notification for assigned user                    │
│  8. ✅ Return updated job                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Refresh job data                                      │
│  1. fetchJob() called                                            │
│  2. New status displayed in UI                                   │
│  3. Timeline updated with status change entry                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Status Workflow Rules**

### **Role-Based Permissions:**

| Role       | Can Change Status? | Completion Handling            |
|------------|-------------------|--------------------------------|
| ADMIN      | ✅ All statuses    | Direct COMPLETED               |
| MANAGER    | ✅ All statuses    | Direct COMPLETED               |
| SUPERVISOR | ✅ All statuses    | Direct COMPLETED               |
| STAFF      | ✅ All statuses    | COMPLETED → AWAITING_APPROVAL  |

### **Status Transitions:**

```
PENDING 
  ↓
IN_PROGRESS (Work started)
  ↓
ON_HOLD (Missing info) ←→ IN_PROGRESS (Info received)
  ↓
AWAITING_APPROVAL (Staff requests completion)
  ↓
COMPLETED (Manager/Supervisor approves)
```

---

## 📝 **Key Points for Modifications:**

### **If you want to change the status options:**
- Update `STATUS_OPTIONS` array in `src/app/jobs/[id]/page.tsx` (Lines 90-96)
- Update `JobStatus` enum in `prisma/schema.prisma`
- Run `npx prisma generate && npx prisma db push`

### **If you want to change who can update status:**
- Modify permission checks in `src/lib/permissions.ts`
- Update logic in PATCH endpoint (Line 133-140)

### **If you want to add automatic actions on status change:**
- Add logic after Line 163 in `src/app/api/jobs/[id]/route.ts`
- Example: Send email, update related records, trigger webhooks

### **If you want to change approval workflow:**
- Modify `handleStatusChange` function (Lines 134-163)
- Update `needsApprovalToComplete` logic
- Add custom approval states

### **If you want to track additional data:**
- Extend StatusUpdate model in schema
- Update the create statement (Line 165-173)
- Add fields to timeline display

---

## 🐛 **Common Issues & Solutions:**

### **Issue: "Foreign key constraint violated"**
**Solution:** API now fetches database user by email first (Line 106-112)

### **Issue: Status doesn't update in UI**
**Solution:** `fetchJob()` is called after successful update (Line 156)

### **Issue: Permission denied**
**Solution:** Check `canEditJobDetails` in permissions.ts

### **Issue: Timeline not showing status change**
**Solution:** StatusUpdate record created automatically (Lines 165-173)

---

## 💡 **What Changes Do You Want to Make?**

Let me know what you'd like to modify:
- Different status options?
- Change permission rules?
- Add validation?
- Custom workflow logic?
- Additional notifications?
- Automatic actions on status change?

I can help you implement any changes! 🚀
