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
} from "lucide-react";
import { canCreateJobs } from "@/lib/permissions";
import { formatTimeAgo } from "@/lib/utils";

type ServiceType = "BOOKKEEPING" | "VAT" | "AUDIT" | "FINANCIAL_STATEMENTS";

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
  action: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
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
    AUDIT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    FINANCIAL_STATEMENTS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };
  const labels = {
    BOOKKEEPING: "Bookkeeping",
    VAT: "VAT",
    AUDIT: "Audit",
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // For supervisors assigning staff
  const [assigningStaff, setAssigningStaff] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]); // NEW: All users for filter

  useEffect(() => {
    if (session) {
      fetchJobs();
      fetchAllUsers(); // NEW: Fetch all users for filter
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

    // NEW: User filter with role-based logic
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

    return matchesSearch && matchesServiceType && matchesPriority && matchesStatus && matchesUser;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Active Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredJobs.length} of {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <Table2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
            {session && session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Link>
            )}
            <Link
              href="/jobs/completed"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Completed
            </Link>
            <Link
              href="/jobs/cancelled"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Archive className="w-5 h-5" />
              Cancelled
            </Link>
            {session && canCreateJobs(session.user.role) && (
              <Link
                href="/jobs/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Job
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            {(searchTerm || serviceTypeFilter !== "ALL" || priorityFilter !== "ALL" || statusFilter !== "ALL" || userFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setServiceTypeFilter("ALL");
                  setPriorityFilter("ALL");
                  setStatusFilter("ALL");
                  setUserFilter("ALL");
                }}
                className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Job ID, Title, Client, Staff..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Service Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Type
              </label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Service Types</option>
                <option value="BOOKKEEPING">Bookkeeping</option>
                <option value="VAT">VAT</option>
                <option value="AUDIT">Audit</option>
                <option value="FINANCIAL_STATEMENTS">Financial Statements</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Filter by User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Showing jobs {selectedUser.role === 'STAFF' ? 'assigned to' : 
                                selectedUser.role === 'SUPERVISOR' ? 'supervised by' : 
                                'managed by'} {selectedUser.name}
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Excel-Style Table with Accordion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {jobs.length === 0 ? "No jobs found" : "No jobs match your filters"}
            </div>
          ) : viewMode === "table" ? (
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Service Types
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Job Started
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 inline" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.map((job) => (
                  <Fragment key={job.id}>
                    {/* Main Row - Clickable */}
                    <tr
                      onClick={() => toggleExpand(job.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {job.jobId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {job.clientName}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {job.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {job.serviceTypes && job.serviceTypes.length > 0 ? (
                            job.serviceTypes.map((type) => (
                              <span key={type}>{getServiceTypeBadge(type)}</span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No types</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStateLabel(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {job.manager?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.manager!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {job.manager.name}
                          </button>
                        ) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {job.supervisor?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.supervisor!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {job.supervisor.name}
                          </button>
                        ) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {job.assignedTo?.name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserFilter(job.assignedTo!.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {job.assignedTo.name}
                          </button>
                        ) : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {job.startedAt ? new Date(job.startedAt).toLocaleDateString() : "Not started"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                        {job._count.comments}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {expandedJobId === job.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 inline" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 inline" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded Content Row - Timeline & Actions */}
                    {expandedJobId === job.id && (
                      <tr>
                        <td colSpan={12} className="px-0 py-0">
                          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                            {/* Actions */}
                            <div className="mb-4 flex gap-2 flex-wrap">
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

                              <Link
                                href={`/jobs/${job.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                View Details
                              </Link>
                            </div>

                    {/* Timeline - Enhanced Design */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-blue-600 rounded-md">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          Timeline
                        </h3>
                      </div>

                      {loadingTimeline[job.id] ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading timeline...
                        </div>
                      ) : timeline[job.id] && timeline[job.id].length > 0 ? (
                        <div className="space-y-3">
                          {timeline[job.id].map((event, idx) => {
                            const iconBgClass = 
                              event.action === "COMMENT_ADDED" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                              event.action === "STAFF_ASSIGNED" ? "bg-gradient-to-br from-green-500 to-green-600" :
                              event.action === "COMPLETION_REQUESTED" ? "bg-gradient-to-br from-purple-500 to-purple-600" :
                              "bg-gradient-to-br from-gray-500 to-gray-600";

                            return (
                            <div key={event.id} className="relative">
                              <div className="flex gap-3">
                                {/* Icon with connecting line */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${iconBgClass}`}>
                                    {event.action === "COMMENT_ADDED" ? (
                                      <MessageSquare className="w-4 h-4 text-white" />
                                    ) : event.action === "STAFF_ASSIGNED" ? (
                                      <User className="w-4 h-4 text-white" />
                                    ) : event.action === "COMPLETION_REQUESTED" ? (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  {idx < timeline[job.id].length - 1 && (
                                    <div className="w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 mt-1" />
                                  )}
                                </div>

                                <div className="flex-1 pb-2">
                                {event.action === "COMMENT_ADDED" ? (
                                  // Comment style - more prominent with card
                                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border-l-4 border-blue-500">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                      <span className="text-blue-600 dark:text-blue-400">{event.user.name}</span> commented:
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2.5">
                                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                        {event.newValue}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      {formatTimeAgo(new Date(event.timestamp))}
                                    </div>
                                  </div>
                                ) : (
                                  // Other events - card style
                                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-semibold">{event.user.name}</span>
                                      {" "}
                                      {event.action === "JOB_CREATED" && "created this job"}
                                      {event.action === "STAFF_ASSIGNED" && `assigned to ${event.newValue}`}
                                      {event.action === "COMPLETION_REQUESTED" && "requested completion"}
                                      {event.action === "STATUS_CHANGED" && `changed status to ${event.newValue ? getStatusLabel(event.newValue) : "N/A"}`}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => toggleExpand(job.id)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Job #{job.id}
                        </div>
                        <h3 className="font-semibold text-lg">{job.clientName}</h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status === "PENDING_APPROVAL"
                          ? "Pending"
                          : job.status === "IN_PROGRESS"
                          ? "In Progress"
                          : job.status === "PENDING_COMPLETION"
                          ? "Pending Complete"
                          : "Assigned"}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {job.title}
                    </p>

                    {/* Service Types */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Service Types
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.serviceTypes && job.serviceTypes.length > 0 ? (
                          job.serviceTypes.map((type) => (
                            <span key={type}>{getServiceTypeBadge(type)}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No types</span>
                        )}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Priority
                      </div>
                      {getPriorityBadge(job.priority)}
                    </div>

                    {/* Team Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {job.department?.name || "No Department"}
                        </span>
                      </div>
                      {job.manager && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Manager: {job.manager.name}
                          </span>
                        </div>
                      )}
                      {job.supervisor && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Supervisor: {job.supervisor.name}
                          </span>
                        </div>
                      )}
                      {job.assignedTo && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-300">
                            Staff: {job.assignedTo.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comments Count */}
                    {job._count && job._count.comments > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <MessageSquare className="w-4 h-4" />
                          <span>{job._count.comments} comments</span>
                        </div>
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
                            {job.timeline.map((event: any) => (
                              <div
                                key={event.id}
                                className="bg-white dark:bg-gray-800 p-3 rounded"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-sm font-medium">
                                    {event.action}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {event.details && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {event.details}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  by {event.user.name}
                                </div>
                              </div>
                            ))}
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
      </div>
    </div>
  );
}
