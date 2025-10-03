# Role Permissions Matrix

This document defines the exact permissions for each role in the Job Tracking App.

## Role Hierarchy

```
ADMIN (Full System Access)
  ↓
MANAGER (Full Job Management)
  ↓
SUPERVISOR (Assignment & Approval)
  ↓
STAFF (View & Update)
```

---

## 👤 STAFF Permissions

### ✅ What STAFF Can Do:
- View jobs assigned to them
- Update job status (Not Started → In Progress, etc.)
- Leave comments on jobs
- Request to mark jobs as complete (requires approval from Supervisor/Manager)
- Upload attachments to jobs
- View their own notifications
- Edit their own profile

### ❌ What STAFF Cannot Do:
- Create new jobs
- Assign jobs to others
- Edit job details (title, description, priority)
- Delete jobs
- Approve job completions
- View other users' jobs (unless shared)
- Manage users or departments

---

## 👔 SUPERVISOR Permissions

### ✅ What SUPERVISOR Can Do:
**Everything STAFF can do, PLUS:**
- View all jobs in their department
- Assign jobs to staff members
- Reassign jobs between staff
- Mark jobs as complete (direct approval)
- Approve completion requests from staff
- View team members in their department

### ❌ What SUPERVISOR Cannot Do:
- Create new jobs (can only assign existing ones)
- Edit job details (title, description, priority, due date)
- Delete jobs
- Create/edit/delete users
- Manage departments

---

## 👨‍💼 MANAGER Permissions

### ✅ What MANAGER Can Do:
**Everything STAFF + SUPERVISOR can do, PLUS:**
- **Add new jobs** - Create jobs from scratch
- **Edit job details** - Change title, description, priority, due date, tags
- **Delete jobs** - Remove jobs entirely
- **Update job information** - Modify any job field
- View all jobs in their department
- Manage department workflow
- Generate department reports

### ❌ What MANAGER Cannot Do:
- Create new users
- Edit user accounts
- Reset passwords (except their own)
- Delete users
- View jobs from other departments (unless they're ADMIN)
- Manage system settings

---

## 🔑 ADMIN Permissions

### ✅ What ADMIN Can Do:
**Everything STAFF + SUPERVISOR + MANAGER can do, PLUS:**
- **Create new users** - Add users to the system
- **Edit user details** - Change names, emails, roles, departments
- **Reset passwords** - Reset any user's password
- **Delete users** - Remove users from the system
- **Deactivate/Activate users** - Enable or disable accounts
- View all jobs across ALL departments
- Manage all departments
- Assign department managers
- Full system configuration
- View system-wide analytics

### ❌ What ADMIN Cannot Do:
- Nothing - ADMIN has full access to everything

---

## Permission Functions Reference

Here are the functions you can use to check permissions:

### Staff Level
```typescript
canViewOwnJobs(role)           // true for all
canUpdateJobStatus(role)       // true for all
canLeaveComments(role)         // true for all
canRequestCompletion(role)     // true for all
```

### Supervisor Level
```typescript
canViewDepartmentJobs(role)    // SUPERVISOR, MANAGER, ADMIN
canAssignJobs(role)            // SUPERVISOR, MANAGER, ADMIN
canApproveCompletion(role)     // SUPERVISOR, MANAGER, ADMIN
canReassignJob(role)           // SUPERVISOR, MANAGER, ADMIN
```

### Manager Level
```typescript
canCreateJobs(role)            // MANAGER, ADMIN
canEditJobDetails(role)        // MANAGER, ADMIN
canDeleteJobs(role)            // MANAGER, ADMIN
canViewAllDepartmentJobs(role) // MANAGER, ADMIN
```

### Admin Level
```typescript
canManageUsers(role)           // ADMIN only
canCreateUsers(role)           // ADMIN only
canEditUsers(role)             // ADMIN only
canResetPasswords(role)        // ADMIN only
canDeleteUsers(role)           // ADMIN only
canViewAllJobs(role)           // ADMIN only
canManageDepartments(role)     // ADMIN only
```

### Special Checks
```typescript
needsApprovalToComplete(role)  // true for STAFF only
```

---

## Job Completion Workflow

### STAFF:
1. Work on job
2. Click "Request Completion"
3. Job status → PENDING_REVIEW
4. Wait for Supervisor/Manager approval

### SUPERVISOR / MANAGER:
1. Work on job (or review staff request)
2. Click "Mark as Complete"
3. Job status → COMPLETED immediately (no approval needed)

### ADMIN:
- Same as MANAGER (can complete immediately)

---

## Example Scenarios

### Scenario 1: Creating a Job
- **STAFF**: ❌ Cannot create
- **SUPERVISOR**: ❌ Cannot create
- **MANAGER**: ✅ Can create and assign
- **ADMIN**: ✅ Can create and assign

### Scenario 2: Completing a Job
- **STAFF**: Request completion → Needs approval
- **SUPERVISOR**: Mark complete → Done immediately
- **MANAGER**: Mark complete → Done immediately
- **ADMIN**: Mark complete → Done immediately

### Scenario 3: Editing Job Title
- **STAFF**: ❌ Cannot edit
- **SUPERVISOR**: ❌ Cannot edit
- **MANAGER**: ✅ Can edit all details
- **ADMIN**: ✅ Can edit all details

### Scenario 4: Managing Users
- **STAFF**: ❌ No access
- **SUPERVISOR**: ❌ No access
- **MANAGER**: ❌ No access
- **ADMIN**: ✅ Full user management

---

This ensures clear separation of responsibilities and proper workflow!
