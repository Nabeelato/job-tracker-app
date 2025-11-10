# Job Tracker App - Current Status

**Last Updated:** November 10, 2025  
**Latest Commit:** `6a911d7` - "fix: Move accordion trigger to action button only"  
**Branch:** `main`

---

## 🚀 Project Overview

Next.js 14+ Team Task Management System with TypeScript, Tailwind CSS, Prisma, NextAuth.js

---

## ✅ Recently Completed Features

### Excel Import System (v2)
- ✅ Flexible status mapping (matches by prefix/keywords: 02, 03, 04, etc.)
- ✅ Exact priority text import (no more forced defaults)
- ✅ Duplicate jobId detection (skips & reports)
- ✅ Client name, job title, manager import
- ✅ Auto-assignment to available staff

### Client Reply Tracking
- ✅ "Awaiting Client Reply" status (blue background override)
- ✅ "Reply Received" status (returns to time-based colors)
- ✅ Timeline integration with Mail icons
- ✅ Visible to all users

### Quick Edit Feature
- ✅ Edit jobs directly from jobs list (Admin/Manager only)
- ✅ Modal with client name, job title, priority, status fields
- ✅ Instant save without page navigation

### Related Jobs Feature
- ✅ Shows count of other jobs for same client
- ✅ Collapsible banner on job detail page
- ✅ Lists job ID, title, manager for related jobs
- ✅ Click to navigate to related job
- ✅ Permission-aware (all users can see)

### UI Improvements
- ✅ Removed service type column from jobs list (table & card views)
- ✅ Removed service type filter
- ✅ Accordion view action button placement fix
- ✅ Timeline auto-refresh after actions (no manual refresh needed)

---

## 📊 Database Status

### Current State
- **Jobs:** 0 (cleared for fresh Excel import testing)
- **Schema Version:** Latest migration applied
- **Status Enum:** Updated to match exact workflow stages

### Job Status Values (Enum)
```typescript
RFI_EMAIL_TO_CLIENT_SENT          → "02. RFI / Email to client sent"
INFO_SENT_TO_LAHORE_JOB_STARTED   → "03. Info sent to Lahore / Job started"
MISSING_INFO_CHASE_CLIENT         → "04. Missing info / Chase client"
LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE → "05. Lahore to proceed / client Info complete"
FOR_REVIEW_WITH_JACK              → "06. For review with Jack"
COMPLETED                         → "07. Completed"
CANCELLED                         → "Cancelled"
```

### Priority Field
- **Type:** `String` (nullable)
- **Accepts:** Any text from Excel (e.g., "HIGH", "URGENT", "LOW", or custom text)

### Service Types (Deprecated)
- ❌ Removed from UI (column hidden, filters removed)
- ⚠️ Still in database schema but optional/unused

---

## 🔧 Technical Details

### Key Files & Locations

**Excel Import:**
- API: `src/app/api/jobs/import/route.ts`
- Handles: Duplicate detection, flexible status mapping, exact priority import

**Client Reply Tracking:**
- API: `src/app/api/jobs/[id]/client-reply/route.ts`
- DB Field: `awaitingClientReply` (Boolean)

**Related Jobs:**
- API: `src/app/api/jobs/related/route.ts`
- Route config: `export const dynamic = 'force-dynamic';`

**Status Utilities:**
- Helper: `src/lib/status-utils.ts`
- Functions: `getStatusLabel()`, `getStatusColor()`, `getAllStatuses()`

**Job Utilities:**
- Helper: `src/lib/job-utils.ts`
- Functions: Priority/status color mapping (updated for string priority)

**Cleanup Script:**
- Script: `prisma/clear-jobs.ts`
- Usage: `npx tsx prisma/clear-jobs.ts`

---

## 🐛 Known Issues / Warnings

### Resolved
- ✅ TypeScript errors from Priority enum removal (fixed)
- ✅ ESLint unescaped quotes (fixed)
- ✅ useEffect dependencies warnings (fixed)
- ✅ Next.js dynamic route warnings (fixed with `force-dynamic`)
- ✅ Related jobs 300+ row display issue (fixed with collapsible UI)

### Active Concerns
- ⚠️ **Service type column:** Still in DB schema but hidden in UI (safe to ignore for now)
- ⚠️ **Data migrations:** Future schema changes may require careful data handling

---

## 📝 Next Steps / TODO

### Immediate
- [ ] Test Excel import with real data
- [ ] Verify all 6 status states import correctly
- [ ] Confirm priority text imports exactly as in Excel

### Future Enhancements
- [ ] Bulk operations improvement
- [ ] Advanced filtering options
- [ ] Export to Excel functionality
- [ ] Performance optimization for large datasets
- [ ] Mobile responsive improvements

---

## 🔒 Data Safety Notes

### When Data Gets Wiped
1. **Schema migrations** (`npx prisma migrate dev`)
2. **Database reset** (`npx prisma migrate reset`)
3. **Manual cleanup scripts** (`npx tsx prisma/clear-jobs.ts`)
4. **Container rebuild** (if DB not in volume)

### Protection Strategies
- ✅ Always backup before schema changes
- ✅ Test migrations in dev first
- ✅ Use `prisma migrate deploy` in production (not `dev`)
- ✅ Never use `--force-reset` in production
- ✅ Keep data migration scripts for enum changes

---

## 🌐 Environment Info

**Development:**
- Container: Ubuntu 24.04.2 LTS
- Node: Latest LTS
- Database: PostgreSQL (via Prisma)
- Port: 3002 (dev server)

**Production:**
- Platform: Vercel
- Database: Managed PostgreSQL

---

## 💡 Quick Context for New Sessions

**If starting fresh on a different device:**
1. Check this file for latest status
2. Review recent git commits (`git log --oneline -10`)
3. Check `git status` for uncommitted changes
4. Read `.github/copilot-instructions.md` for project setup

**Common Commands:**
```bash
# Start dev server
npm run dev

# Database operations
npx prisma migrate dev
npx prisma studio
npx tsx prisma/clear-jobs.ts

# Git operations
git log --oneline -5
git status
git diff
```

---

## 📞 Context Recovery Helper

**Tell GitHub Copilot:**
- "Working on: [feature name]"
- "Latest commit: 6a911d7"
- "Issue: [describe problem]"
- "Refer to CURRENT_STATUS.md"

This helps Copilot understand context without chat history.

---

**End of Status Document**
