"use client";

// Jobs page with filters and view modes
import { useState, useEffect, Fragment } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  CheckCircle,
  MessageSquare,
  Archive,
  Shield,
  Search,
  Filter,
  Grid3X3,
  Table2,
  Building2,
  Calendar,
  AlertCircle,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { canCreateJobs } from "@/lib/permissions";
import { formatTimeAgo } from "@/lib/utils";
import { getAvailableMonths } from "@/lib/date-utils";
import { getActivityStatus } from "@/lib/business-hours";
import MonthlyJobsView from "@/components/monthly-jobs-view";

type ServiceType = "BOOKKEEPING" | "VAT" | "CESSATION_OF_ACCOUNT" | "FINANCIAL_STATEMENTS";

interface Job {
  id: string;
  jobId: string;
  clientName: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  serviceTypes: ServiceType[];
  dueDate: string;
  startedAt?: string | null;
  lastActivityAt?: string | null;
  reminderSnoozeUntil?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  manager?: {
    id: string;
    name: string;
  } | null;
  supervisor?: {
    id: string;
    name: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
  timeline?: Array<{
    id: string;
    action: string;
    details?: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

interface TimelineEvent {
  id: string;
  type?: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  content?: string;
  timestamp: string;
  createdAt?: string;
  user: {
    name: string;
  };
}

// Status options for label mapping
const STATUS_OPTIONS = [
  { value: "PENDING", label: "02: RFI" },
  { value: "IN_PROGRESS", label: "03: Info Sent to Lahore" },
  { value: "ON_HOLD", label: "04: Missing Info / Chase Info" },
  { value: "AWAITING_APPROVAL", label: "05: Info Completed" },
  { value: "PENDING_COMPLETION", label: "06: Sent to Jack for Review" },
  { value: "COMPLETED", label: "07: Completed" },
];

// Helper function to get status label
const getStatusLabel = (statusValue: string): string => {
  return STATUS_OPTIONS.find(opt => opt.value === statusValue)?.label || statusValue.replace("_", " ");
};

// Helper function to get service type badge
const getServiceTypeBadge = (serviceType: ServiceType) => {
  const styles = {
    BOOKKEEPING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    VAT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    CESSATION_OF_ACCOUNT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    FINANCIAL_STATEMENTS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };
  const labels = {
    BOOKKEEPING: "Bookkeeping",
    VAT: "VAT",
    CESSATION_OF_ACCOUNT: "Cessation of Account",
    FINANCIAL_STATEMENTS: "Financial Statements",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[serviceType]}`}>
      {labels[serviceType]}
    </span>
  );
};

// Helper function to get priority badge
const getPriorityBadge = (priority: string) => {
  const styles = {
    URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    NORMAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles] || styles.NORMAL}`}>
      {priority}
    </span>
  );
};

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Record<string, TimelineEvent[]>>({});
  const [loadingTimeline, setLoadingTimeline] = useState<Record<string, boolean>>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [userFilter, setUserFilter] = useState<string>("ALL"); // NEW: User filter
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL"); // NEW: Department filter
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL"); // NEW: Date range
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false); // NEW: Overdue filter
  const [monthFilter, setMonthFilter] = useState<string>("ALL"); // NEW: Month filter
  const [filtersExpanded, setFiltersExpanded] = useState(false); // NEW: Filter panel expansion state
  const [viewMode, setViewMode] = useState<"table" | "grid" | "monthly">("table"); // Default to table view

  // For supervisors assigning staff
  const [assigningStaff, setAssigningStaff] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]); // NEW: All users for filter
  const [departments, setDepartments] = useState<any[]>([]); // NEW: Departments for filter

  // Bulk actions
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkActionValue, setBulkActionValue] = useState<string>("");
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [performingBulkAction, setPerformingBulkAction] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Comment modal
  const [commentModal, setCommentModal] = useState<{ jobId: string; clientName: string; jobTitle: string } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (session) {
      fetchJobs();
      fetchAllUsers(); // NEW: Fetch all users for filter
      fetchDepartments(); // NEW: Fetch departments
      if (session.user.role === "SUPERVISOR") {
        fetchStaffUsers();
      }
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        // Filter out archived jobs (completed and cancelled)
        const activeJobs = data.filter(
          (job: Job) => job.status !== "COMPLETED" && job.status !== "CANCELLED"
        );
        setJobs(activeJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setStaffUsers(data.filter((u: any) => u.role === "STAFF"));
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchTimeline = async (jobId: string) => {
    if (timeline[jobId]) return; // Already loaded

    setLoadingTimeline({ ...loadingTimeline, [jobId]: true });
    try {
      const response = await fetch(`/api/jobs/${jobId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline({ ...timeline, [jobId]: data });
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoadingTimeline({ ...loadingTimeline, [jobId]: false });
    }
  };

  const toggleExpand = async (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      await fetchTimeline(jobId);
    }
  };

  const assignStaffToJob = async (jobId: string) => {
    if (!selectedStaff) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selectedStaff }),
      });

      if (response.ok) {
        setAssigningStaff(null);
        setSelectedStaff("");
        fetchJobs(); // Refresh jobs list
        alert("Staff assigned successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to assign staff");
      }
    } catch (error) {
      console.error("Error assigning staff:", error);
      alert("Failed to assign staff");
    }
  };

  const requestCompletion = async (jobId: string) => {
    const message = prompt("Add a message for your completion request (optional):");
    if (message === null) return; // User cancelled

    try {
      const response = await fetch(`/api/jobs/${jobId}/request-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        fetchJobs();
        alert("Completion request submitted!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to request completion");
      }
    } catch (error) {
      console.error("Error requesting completion:", error);
      alert("Failed to request completion");
    }
  };

  const getStateLabel = (status: string) => {
    const stateMap: Record<string, string> = {
      PENDING: "02: RFI",
      IN_PROGRESS: "03: Info Sent to Lahore",
      ON_HOLD: "04: Missing Info/Chase Info",
      AWAITING_APPROVAL: "05: Info Completed",
      PENDING_COMPLETION: "06: Sent to Jack for Review",
      COMPLETED: "07: Completed",
    };
    return stateMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      ON_HOLD: "bg-orange-100 text-orange-800",
      AWAITING_APPROVAL: "bg-purple-100 text-purple-800",
      PENDING_COMPLETION: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get activity status indicator color for job row
  const getActivityRowColor = (job: Job): string => {
    // Only show indicators for active jobs (not completed or cancelled)
    if (job.status === "COMPLETED" || job.status === "CANCELLED") {
      return "";
    }

    const lastActivityDate = job.lastActivityAt ? new Date(job.lastActivityAt) : null;
    const snoozeUntil = job.reminderSnoozeUntil ? new Date(job.reminderSnoozeUntil) : null;
    
    const activityStatus = getActivityStatus(lastActivityDate, snoozeUntil);
    
    if (activityStatus === "critical") {
      return "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 border-l-4 border-l-red-500";
    } else if (activityStatus === "warning") {
      return "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30 border-l-4 border-l-yellow-500";
    } else if (activityStatus === "active") {
      return "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-l-4 border-l-green-500";
    }
    
    // Snoozed (no indicator)
    return "hover:bg-gray-50 dark:hover:bg-gray-750";
  };

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.manager?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.supervisor?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesServiceType =
      serviceTypeFilter === "ALL" ||
      job.serviceTypes?.includes(serviceTypeFilter as ServiceType);

    const matchesPriority =
      priorityFilter === "ALL" || job.priority === priorityFilter;

    const matchesStatus =
      statusFilter === "ALL" || job.status === statusFilter;

    // User filter with role-based logic
    const matchesUser = userFilter === "ALL" || (() => {
      const selectedUser = allUsers.find(u => u.id === userFilter);
      if (!selectedUser) return true;

      // Filter based on the selected user's role
      switch (selectedUser.role) {
        case "STAFF":
          return job.assignedTo?.id === userFilter;
        case "SUPERVISOR":
          return job.supervisor?.id === userFilter;
        case "MANAGER":
          return job.manager?.id === userFilter;
        case "ADMIN":
          // Admin can be manager, supervisor, or assigned
          return job.manager?.id === userFilter || 
                 job.supervisor?.id === userFilter || 
                 job.assignedTo?.id === userFilter;
        default:
          return true;
      }
    })();

    // NEW: Department filter
    const matchesDepartment =
      departmentFilter === "ALL" || job.department?.id === departmentFilter;

    // NEW: Overdue filter
    const isOverdue = job.dueDate && new Date(job.dueDate) < new Date() && job.status !== "COMPLETED";
    const matchesOverdue = !overdueFilter || isOverdue;

    // NEW: Date range filter
    const matchesDateRange = dateRangeFilter === "ALL" || (() => {
      if (!job.dueDate) return false;
      const dueDate = new Date(job.dueDate);
      const today = new Date();
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateRangeFilter) {
        case "TODAY":
          return daysDiff === 0;
        case "THIS_WEEK":
          return daysDiff >= 0 && daysDiff <= 7;
        case "THIS_MONTH":
          return daysDiff >= 0 && daysDiff <= 30;
        case "OVERDUE":
          return daysDiff < 0;
        default:
          return true;
      }
    })();

    // NEW: Month filter (filters by creation month)
    const matchesMonth = monthFilter === "ALL" || (() => {
      const createdDate = new Date(job.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === monthFilter;
    })();

    return matchesSearch && matchesServiceType && matchesPriority && matchesStatus && 
           matchesUser && matchesDepartment && matchesOverdue && matchesDateRange && matchesMonth;
  });

  // Sort filtered jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "jobId":
        comparison = a.jobId.localeCompare(b.jobId);
        break;
      case "clientName":
        comparison = a.clientName.localeCompare(b.clientName);
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                     (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "dueDate":
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "assignedTo":
        const aAssigned = a.assignedTo?.name || "Unassigned";
        const bAssigned = b.assignedTo?.name || "Unassigned";
        comparison = aAssigned.localeCompare(bAssigned);
        break;
      case "manager":
        const aManager = a.manager?.name || "N/A";
        const bManager = b.manager?.name || "N/A";
        comparison = aManager.localeCompare(bManager);
        break;
      case "supervisor":
        const aSupervisor = a.supervisor?.name || "N/A";
        const bSupervisor = b.supervisor?.name || "N/A";
        comparison = aSupervisor.localeCompare(bSupervisor);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Get available months for filter dropdown based on start date
  const availableMonths = getAvailableMonths(jobs, 'startedAt');

  // Bulk action handlers
  const toggleSelectAll = () => {
    if (selectedJobs.size === sortedJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(sortedJobs.map((j) => j.id)));
    }
  };

  const toggleSelectJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleAddComment = async () => {
    if (!commentModal || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/jobs/${commentModal.jobId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setCommentModal(null);
        setNewComment("");
        fetchJobs(); // Refresh to show new comment in timeline
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedJobs.size === 0) return;

    setPerformingBulkAction(true);
    try {
      const updates = Array.from(selectedJobs).map(async (jobId) => {
        let updateData: any = {};

        switch (bulkAction) {
          case "status":
            updateData = { status: bulkActionValue };
            break;
          case "priority":
            updateData = { priority: bulkActionValue };
            break;
          case "archive":
            updateData = { status: "CANCELLED" };
            break;
          default:
            return;
        }

        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error(`Failed to update job ${jobId}`);
        }
      });

      await Promise.all(updates);
      
      // Refresh jobs list
      await fetchJobs();
      
      // Reset selection and modal
      setSelectedJobs(new Set());
      setBulkAction("");
      setBulkActionValue("");
      setShowBulkActionModal(false);
      
      alert(`Successfully updated ${selectedJobs.size} job(s)`);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform bulk action. Some jobs may not have been updated.");
    } finally {
      setPerformingBulkAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Active Jobs
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {sortedJobs.length} of {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode("monthly")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "monthly"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Monthly View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Table View"
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
            {session && session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            <Link
              href="/jobs/completed"
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Completed
            </Link>
            <Link
              href="/jobs/cancelled"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            >
              <Archive className="w-4 h-4" />
              Cancelled
            </Link>
            {session && canCreateJobs(session.user.role) && (
              <Link
                href="/jobs/new"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Job
              </Link>
            )}
          </div>
        </div>

        {/* Filters - Collapsible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Filter Header - Always Visible */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Filters & Search
              </h2>
              {/* Active Filters Badge */}
              {(() => {
                const activeFiltersCount = [
                  searchTerm,
                  serviceTypeFilter !== "ALL" ? 1 : 0,
                  priorityFilter !== "ALL" ? 1 : 0,
                  statusFilter !== "ALL" ? 1 : 0,
                  userFilter !== "ALL" ? 1 : 0,
                  departmentFilter !== "ALL" ? 1 : 0,
                  dateRangeFilter !== "ALL" ? 1 : 0,
                  monthFilter !== "ALL" ? 1 : 0,
                  overdueFilter ? 1 : 0
                ].filter(f => f).length;
                
                return activeFiltersCount > 0 ? (
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-semibold rounded-full">
                    {activeFiltersCount}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-1.5">
              {(searchTerm || serviceTypeFilter !== "ALL" || priorityFilter !== "ALL" || statusFilter !== "ALL" || userFilter !== "ALL" || departmentFilter !== "ALL" || dateRangeFilter !== "ALL" || monthFilter !== "ALL" || overdueFilter) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    setServiceTypeFilter("ALL");
                    setPriorityFilter("ALL");
                    setStatusFilter("ALL");
                    setUserFilter("ALL");
                    setDepartmentFilter("ALL");
                    setDateRangeFilter("ALL");
                    setMonthFilter("ALL");
                    setOverdueFilter(false);
                  }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
              {filtersExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>
          </button>

          {/* Filter Content - Collapsible */}
          {filtersExpanded && (
            <div className="px-3 pb-3 pt-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {/* Search */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Job ID, Title, Client..."
                      className="w-full pl-7 pr-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Service Type Filter */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceTypeFilter}
                    onChange={(e) => setServiceTypeFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Service Types</option>
                    <option value="BOOKKEEPING">Bookkeeping</option>
                    <option value="VAT">VAT</option>
                    <option value="CESSATION_OF_ACCOUNT">Cessation of Account</option>
                    <option value="FINANCIAL_STATEMENTS">Financial Statements</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">02: RFI</option>
                    <option value="IN_PROGRESS">03: Info Sent to Lahore</option>
                    <option value="ON_HOLD">04: Missing Info/Chase Info</option>
                    <option value="AWAITING_APPROVAL">05: Info Completed</option>
                  </select>
                </div>

                {/* User Filter - NEW */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <User className="w-3 h-3 inline mr-0.5" />
                    User
                  </label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Users</option>
                    {session?.user && (
                      <option value={session.user.id} className="font-bold">
                        🔵 My Jobs
                      </option>
                    )}
                    <optgroup label="Staff">
                      {allUsers.filter(u => u.role === 'STAFF').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.department && `(${user.department.name})`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Supervisors">
                      {allUsers.filter(u => u.role === 'SUPERVISOR').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.department && `(${user.department.name})`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Managers">
                      {allUsers.filter(u => u.role === 'MANAGER').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.department && `(${user.department.name})`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Admins">
                      {allUsers.filter(u => u.role === 'ADMIN').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {userFilter !== "ALL" && (() => {
                    const selectedUser = allUsers.find(u => u.id === userFilter);
                    return selectedUser ? (
                      <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400">
                        {selectedUser.role === 'STAFF' ? 'assigned to' : 
                         selectedUser.role === 'SUPERVISOR' ? 'supervised by' : 
                         'managed by'} {selectedUser.name}
                      </p>
                    ) : null;
                  })()}
                </div>

                {/* Department Filter - NEW */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Building2 className="w-3 h-3 inline mr-0.5" />
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter - NEW */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-0.5" />
                    Due Date
                  </label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Due Today</option>
                    <option value="THIS_WEEK">Due This Week</option>
                    <option value="THIS_MONTH">Due This Month</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>

                {/* Month Filter - NEW */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-0.5" />
                    Filter by Month
                  </label>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Months</option>
                    {availableMonths.map(({ key, label, count }) => (
                      <option key={key} value={key}>
                        {label} ({count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Overdue Only Toggle - NEW */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Show Only
                  </label>
                  <label className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                    <input
                      type="checkbox"
                      checked={overdueFilter}
                      onChange={(e) => setOverdueFilter(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Overdue Jobs</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedJobs.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-blue-900 dark:text-blue-100 font-medium">
                  {selectedJobs.size} job{selectedJobs.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value);
                    if (e.target.value === "archive") {
                      setShowBulkActionModal(true);
                    } else {
                      setBulkActionValue("");
                    }
                  }}
                  className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Action</option>
                  <option value="status">Change Status</option>
                  <option value="priority">Change Priority</option>
                  <option value="archive">Archive Jobs</option>
                </select>

                {bulkAction === "status" && (
                  <select
                    value={bulkActionValue}
                    onChange={(e) => setBulkActionValue(e.target.value)}
                    className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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

                {bulkAction === "priority" && (
                  <select
                    value={bulkActionValue}
                    onChange={(e) => setBulkActionValue(e.target.value)}
                    className="px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                )}

                <button
                  onClick={() => setShowBulkActionModal(true)}
                  disabled={!bulkAction || (bulkAction !== "archive" && !bulkActionValue)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Confirmation Modal */}
        {showBulkActionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Bulk Action
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to {bulkAction === "archive" ? "archive" : "update"}{" "}
                {selectedJobs.size} job{selectedJobs.size !== 1 ? "s" : ""}?
                {bulkAction === "status" && bulkActionValue && (
                  <span className="block mt-2 font-medium">
                    New status: {bulkActionValue === "PENDING" ? "02: RFI" :
                                 bulkActionValue === "IN_PROGRESS" ? "03: Info Sent to Lahore" :
                                 bulkActionValue === "ON_HOLD" ? "04: Missing Info/Chase Info" :
                                 bulkActionValue === "AWAITING_APPROVAL" ? "05: Info Completed" :
                                 bulkActionValue === "PENDING_COMPLETION" ? "06: Sent to Jack for Review" :
                                 bulkActionValue === "COMPLETED" ? "07: Completed" :
                                 bulkActionValue}
                  </span>
                )}
                {bulkAction === "priority" && bulkActionValue && (
                  <span className="block mt-2 font-medium">
                    New priority: {bulkActionValue}
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkActionModal(false)}
                  disabled={performingBulkAction}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={performingBulkAction}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {performingBulkAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Display - Monthly/Table/Grid Views */}
        {sortedJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {jobs.length === 0 ? "No jobs found" : "No jobs match your filters"}
            </div>
          </div>
        ) : viewMode === "monthly" ? (
          <MonthlyJobsView
            jobs={sortedJobs}
            onJobClick={toggleExpand}
            expandedJobId={expandedJobId}
            timeline={timeline}
            loadingTimeline={loadingTimeline}
            selectedJobs={selectedJobs}
            onToggleSelectJob={toggleSelectJob}
            showCheckboxes={true}
            onUserFilter={setUserFilter}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {viewMode === "table" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedJobs.size === sortedJobs.length && sortedJobs.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("jobId")}
                  >
                    <div className="flex items-center gap-1">
                      Job ID
                      {sortBy === "jobId" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "jobId" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("clientName")}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {sortBy === "clientName" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "clientName" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Job Title
                      {sortBy === "title" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "title" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Service
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-1">
                      Priority
                      {sortBy === "priority" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "priority" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === "status" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "status" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("manager")}
                  >
                    <div className="flex items-center gap-1">
                      Manager
                      {sortBy === "manager" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "manager" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("supervisor")}
                  >
                    <div className="flex items-center gap-1">
                      Supervisor
                      {sortBy === "supervisor" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "supervisor" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("assignedTo")}
                  >
                    <div className="flex items-center gap-1">
                      Staff
                      {sortBy === "assignedTo" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "assignedTo" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Started
                      {sortBy === "createdAt" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "createdAt" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1">
                      Due Date
                      {sortBy === "dueDate" && (
                        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortBy !== "dueDate" && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    <MessageSquare className="w-3.5 h-3.5 inline" />
                  </th>
                  <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {sortedJobs.map((job) => (
                  <Fragment key={job.id}>
                    {/* Main Row - Clickable */}
                    <tr
                      onClick={() => toggleExpand(job.id)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 ${getActivityRowColor(job)}`}
                    >
                      <td 
                        className="px-2 py-1.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedJobs.has(job.id)}
                          onChange={() => toggleSelectJob(job.id)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-xs font-mono font-medium text-gray-900 dark:text-white">
                        {job.jobId}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-white max-w-[120px] truncate">
                        {job.clientName}
                      </td>
                      <td className="px-2 py-1.5 text-xs font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
                        {job.title}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-wrap gap-0.5">
                          {job.serviceTypes && job.serviceTypes.length > 0 ? (
                            job.serviceTypes.slice(0, 2).map((type) => (
                              <span key={type}>{getServiceTypeBadge(type)}</span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          {job.serviceTypes && job.serviceTypes.length > 2 && (
                            <span className="text-xs text-gray-500">+{job.serviceTypes.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStateLabel(job.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {job.manager?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.manager!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            title={job.manager.name}
                          >
                            {job.manager.name}
                          </button>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {job.supervisor?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.supervisor!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            title={job.supervisor.name}
                          >
                            {job.supervisor.name}
                          </button>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {job.assignedTo?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.assignedTo!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            title={job.assignedTo.name}
                          >
                            {job.assignedTo.name}
                          </button>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                        {job.startedAt ? new Date(job.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        {job.dueDate ? (() => {
                          const dueDate = new Date(job.dueDate);
                          const today = new Date();
                          const isOverdue = dueDate < today && job.status !== "COMPLETED";
                          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                              <div>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                              {isOverdue && (
                                <div className="text-[10px] text-red-500">
                                  -{Math.abs(daysDiff)}d
                                </div>
                              )}
                              {!isOverdue && daysDiff >= 0 && daysDiff <= 7 && (
                                <div className="text-[10px] text-orange-500 dark:text-orange-400">
                                  {daysDiff === 0 ? 'Today' : `${daysDiff}d`}
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-center text-gray-600 dark:text-gray-400">
                        {job._count.comments > 0 ? job._count.comments : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-center">
                        {expandedJobId === job.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded Content Row - Timeline & Actions */}
                    {expandedJobId === job.id && (
                      <tr>
                        <td colSpan={14} className="px-0 py-0">
                          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-750">
                            {/* Actions */}
                            <div className="mb-3 flex gap-2 flex-wrap">
                              {/* Supervisor can assign staff */}
                              {session?.user.role === "SUPERVISOR" && 
                               job.supervisor?.name === session.user.name && 
                               !job.assignedTo && (
                                <div className="flex gap-2 items-center">
                                  {assigningStaff === job.id ? (
                                    <>
                                      <select
                                        value={selectedStaff}
                                        onChange={(e) => setSelectedStaff(e.target.value)}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="">Select staff...</option>
                                        {staffUsers.map((user) => (
                                          <option key={user.id} value={user.id}>
                                            {user.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          assignStaffToJob(job.id);
                                        }}
                                        disabled={!selectedStaff}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        Assign
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAssigningStaff(null);
                                          setSelectedStaff("");
                                        }}
                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssigningStaff(job.id);
                                      }}
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                    >
                                      Assign to Staff
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Staff can request completion */}
                              {session?.user.role === "STAFF" && 
                               job.assignedTo?.id === session.user.id && 
                               job.status !== "COMPLETED" && 
                               job.status !== "AWAITING_APPROVAL" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestCompletion(job.id);
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Request Completion
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCommentModal({ jobId: job.id, clientName: job.clientName, jobTitle: job.title });
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Comment
                              </button>

                              <Link
                                href={`/jobs/${job.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                View Details
                              </Link>
                            </div>

                    {/* Timeline - Compact Design */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="p-1 bg-blue-600 rounded">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                          Timeline
                        </h3>
                      </div>

                      {loadingTimeline[job.id] ? (
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading...
                        </div>
                      ) : timeline[job.id] && timeline[job.id].length > 0 ? (
                        <div className="space-y-2">
                          {timeline[job.id].map((event, idx) => {
                            // Safety checks for event properties
                            if (!event || !event.id) return null;
                            const userName = event.user?.name || 'Unknown User';
                            
                            const iconBgClass = 
                              event.action === "COMMENT_ADDED" ? "bg-blue-500" :
                              event.action === "STAFF_ASSIGNED" ? "bg-green-500" :
                              event.action === "COMPLETION_REQUESTED" ? "bg-purple-500" :
                              "bg-gray-500";

                            return (
                            <div key={event.id} className="relative">
                              <div className="flex gap-2">
                                {/* Icon with connecting line */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${iconBgClass}`}>
                                    {event.action === "COMMENT_ADDED" ? (
                                      <MessageSquare className="w-3 h-3 text-white" />
                                    ) : event.action === "STAFF_ASSIGNED" ? (
                                      <User className="w-3 h-3 text-white" />
                                    ) : event.action === "COMPLETION_REQUESTED" ? (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  {idx < timeline[job.id].length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-300 dark:from-gray-600 mt-1" />
                                  )}
                                </div>

                                <div className="flex-1 pb-1">
                                {event.action === "COMMENT_ADDED" ? (
                                  // Comment style - compact
                                  <div className="bg-white dark:bg-gray-700 rounded p-2 border-l-2 border-blue-500">
                                    <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                                      <span className="text-blue-600 dark:text-blue-400">{userName}</span> commented
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5">
                                      <div className="text-xs text-gray-700 dark:text-gray-200 line-clamp-3">
                                        {event.content || event.newValue || "No comment text"}
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                      {formatTimeAgo(new Date(event.timestamp || event.createdAt || Date.now()))}
                                    </div>
                                  </div>
                                ) : (
                                  // Other events - compact card style
                                  <div className="bg-white dark:bg-gray-700 rounded p-2">
                                    <div className="text-xs text-gray-900 dark:text-white">
                                      <span className="font-medium">{userName}</span>
                                      {" "}
                                      {event.action === "JOB_CREATED" && "created this job"}
                                      {event.action === "STAFF_ASSIGNED" && `assigned to ${event.newValue}`}
                                      {event.action === "COMPLETION_REQUESTED" && "requested completion"}
                                      {event.action === "STATUS_CHANGED" && `changed status to ${event.newValue ? getStatusLabel(event.newValue) : "N/A"}`}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                      {formatTimeAgo(new Date(event.timestamp))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No timeline events yet
                        </div>
                      )}
                    </div>
                  </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {sortedJobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border ${
                    getActivityStatus(
                      job.lastActivityAt ? new Date(job.lastActivityAt) : null,
                      job.reminderSnoozeUntil ? new Date(job.reminderSnoozeUntil) : null
                    ) === "critical" && job.status !== "COMPLETED" && job.status !== "CANCELLED"
                      ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
                      : getActivityStatus(
                          job.lastActivityAt ? new Date(job.lastActivityAt) : null,
                          job.reminderSnoozeUntil ? new Date(job.reminderSnoozeUntil) : null
                        ) === "warning" && job.status !== "COMPLETED" && job.status !== "CANCELLED"
                      ? "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10"
                      : getActivityStatus(
                          job.lastActivityAt ? new Date(job.lastActivityAt) : null,
                          job.reminderSnoozeUntil ? new Date(job.reminderSnoozeUntil) : null
                        ) === "active" && job.status !== "COMPLETED" && job.status !== "CANCELLED"
                      ? "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => toggleExpand(job.id)}
                >
                  <div className="p-3">
                    {/* Header - Compact */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 font-mono">
                          #{job.jobId}
                        </div>
                        <h3 className="font-semibold text-sm truncate">{job.clientName}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ml-2 flex-shrink-0 ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStateLabel(job.status)}
                      </span>
                    </div>

                    {/* Title - Truncated */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {job.title}
                    </p>

                    {/* Service Types & Priority - Inline */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {job.serviceTypes && job.serviceTypes.length > 0 ? (
                        job.serviceTypes.slice(0, 2).map((type) => (
                          <span key={type}>{getServiceTypeBadge(type)}</span>
                        ))
                      ) : null}
                      {job.serviceTypes && job.serviceTypes.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{job.serviceTypes.length - 2}</span>
                      )}
                      {getPriorityBadge(job.priority)}
                    </div>

                    {/* Team Info - Compact */}
                    <div className="space-y-1 text-xs mb-2">
                      {job.department && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.department.name}</span>
                        </div>
                      )}
                      {job.assignedTo && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 truncate">
                          <User className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="truncate">{job.assignedTo.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Due Date - Compact */}
                    {job.dueDate && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        {(() => {
                          const dueDate = new Date(job.dueDate);
                          const today = new Date();
                          const isOverdue = dueDate < today && job.status !== "COMPLETED";
                          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              {isOverdue && (
                                <span className="text-[10px] text-red-500 font-medium">
                                  -{Math.abs(daysDiff)}d
                                </span>
                              )}
                              {!isOverdue && daysDiff >= 0 && daysDiff <= 7 && (
                                <span className="text-[10px] text-orange-500 dark:text-orange-400">
                                  {daysDiff === 0 ? 'Today' : `${daysDiff}d`}
                                </span>
                              )}
                              {job._count && job._count.comments > 0 && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <MessageSquare className="w-3 h-3" />
                                  <span className="text-[10px]">{job._count.comments}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Expanded View */}
                  {expandedJobId === job.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                      {/* Due Date */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Due Date
                        </div>
                        <div className="text-sm font-medium">
                          {new Date(job.dueDate).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Description */}
                      {job.description && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Description
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Comments */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Comments
                        </div>
                        {job.comments && job.comments.length > 0 ? (
                          <div className="space-y-2">
                            {job.comments.map((comment: any) => (
                              <div
                                key={comment.id}
                                className="bg-white dark:bg-gray-800 p-3 rounded"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-medium">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {comment.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No comments yet
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Timeline
                        </div>
                        {job.timeline && job.timeline.length > 0 ? (
                          <div className="space-y-2">
                            {job.timeline.map((event: any) => {
                              // Safety check for event and user
                              if (!event || !event.id) return null;
                              const userName = event.user?.name || 'Unknown User';
                              
                              return (
                              <div
                                key={event.id}
                                className="bg-white dark:bg-gray-800 p-3 rounded"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                    {event.type === "comment" ? (
                                      <MessageSquare className="w-4 h-4 text-blue-500" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {event.type === "comment" ? "Comment" : event.action}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {event.type === "comment" && event.content && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 pl-6">
                                    {event.content}
                                  </p>
                                )}
                                {event.details && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">
                                    {event.details}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 mt-1 pl-6">
                                  by {userName}
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No timeline events yet
                          </div>
                        )}
                      </div>

                      {/* View Details Button */}
                      <div className="mt-4">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Full Details
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Add Comment
            </h3>
            <div className="mb-4">
              <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                {commentModal.clientName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {commentModal.jobTitle}
              </p>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? "Adding..." : "Add Comment"}
              </button>
              <button
                onClick={() => {
                  setCommentModal(null);
                  setNewComment("");
                }}
                disabled={submittingComment}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
