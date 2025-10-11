"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Calendar,
  User,
  Building2,
  Flag,
  Tag,
  CheckCircle2,
  Circle,
  MessageSquare,
  Send,
  Edit,
  Trash2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { getStatusColor, getPriorityColor } from "@/lib/job-utils";
import { getDueDateStatus } from "@/lib/date-utils";
import {
  canEditJobDetails,
  canDeleteJobs,
  canCommentOnJobs,
  needsApprovalToComplete,
  canCompleteJob,
  canCancelJob,
} from "@/lib/permissions";
import CommentInput from "@/components/comment-input";
import CommentsList from "@/components/comments-list";

interface Job {
  id: string;
  jobId: string;
  clientName: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  tags: string[];
  isLate: boolean;
  completedAt: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedBy: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    name: string;
  } | null;
  supervisor: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  statusUpdates: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "02: RFI" },
  { value: "IN_PROGRESS", label: "03: Info Sent to Lahore" },
  { value: "ON_HOLD", label: "04: Missing Info / Chase Info" },
  { value: "AWAITING_APPROVAL", label: "05: Info Completed" },
  { value: "PENDING_COMPLETION", label: "06: Sent to Jack for Review" },
  { value: "COMPLETED", label: "07: Completed" },
];

// Helper function to get available status options based on user role
const getAvailableStatusOptions = (userRole: string) => {
  // STAFF cannot select COMPLETED or CANCELLED - they must request via PENDING_COMPLETION
  if (userRole === "STAFF") {
    return STATUS_OPTIONS.filter(opt => opt.value !== "COMPLETED");
  }
  // SUPERVISOR, MANAGER, and ADMIN can select all statuses
  return STATUS_OPTIONS;
};

// Helper function to get status label
const getStatusLabel = (statusValue: string): string => {
  return STATUS_OPTIONS.find(opt => opt.value === statusValue)?.label || statusValue.replace("_", " ");
};

export default function JobDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  
  // Custom confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingStatusLabel, setPendingStatusLabel] = useState<string>("");
  const [currentStatusLabel, setCurrentStatusLabel] = useState<string>("");

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveAction, setArchiveAction] = useState<"complete" | "cancel" | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiving, setArchiving] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    clientName: "",
    description: "",
    priority: "",
    dueDate: "",
    assignedToId: "",
    managerId: "",
    supervisorId: "",
  });
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }
      const data = await response.json();
      setJob(data);
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!session || !job) return;

    // Find the label for the new status
    const statusLabel = STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus;
    const currentLabel = STATUS_OPTIONS.find(opt => opt.value === job.status)?.label || job.status;

    // Show custom confirmation modal
    setPendingStatus(newStatus);
    setPendingStatusLabel(statusLabel);
    setCurrentStatusLabel(currentLabel);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setShowConfirmModal(false);
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchJob();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setDeletingJob(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      router.push("/jobs");
    } catch (error: any) {
      setError(error.message || "An error occurred");
      setDeletingJob(false);
    }
  };

  const handleArchiveJob = (action: "complete" | "cancel") => {
    setArchiveAction(action);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!archiveAction) return;

    setArchiving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: archiveAction,
          reason: archiveReason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${archiveAction} job`);
      }

      // Refresh job data
      await fetchJob();
      setShowArchiveModal(false);
      setArchiveReason("");
      setArchiveAction(null);
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setArchiving(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEditJob = () => {
    if (!job) return;
    
    // Pre-fill the form with current job data
    setEditForm({
      title: job.title || "",
      clientName: job.clientName || "",
      description: job.description || "",
      priority: job.priority || "",
      dueDate: job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : "",
      assignedToId: job.assignedTo?.id || "",
      managerId: job.manager?.id || "",
      supervisorId: job.supervisor?.id || "",
    });
    
    fetchUsers();
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(true);

    try {
      // Prepare update data - supervisors can only change staff assignment
      const updateData: any = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate,
        assignedToId: editForm.assignedToId,
      };

      // Only admin and manager can change manager/supervisor assignments
      if (session?.user.role !== "SUPERVISOR") {
        updateData.managerId = editForm.managerId || undefined;
        updateData.supervisorId = editForm.supervisorId || undefined;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      await fetchJob();
      setShowEditModal(false);
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || "Job not found"}
          </h2>
          <Link
            href="/jobs"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const dueDateStatusObj = getDueDateStatus(new Date(job.dueDate));
  const canEdit = session && canEditJobDetails(session.user.role);
  const canDelete = session && canDeleteJobs(session.user.role);
  const canComment = session && canCommentOnJobs(session.user.role);
  const canComplete = session && canCompleteJob(session.user.role);
  const canCancel = session && canCancelJob(session.user.role);
  const isArchived = job.status === "COMPLETED" || job.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Link
                href="/jobs"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                    {job.jobId}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {job.title}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      job.status as any
                    )}`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Client: <strong>{job.clientName}</strong></span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {job.manager && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Manager: <Link href={`/users/${job.manager.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{job.manager.name}</Link></span>
                    </div>
                  )}
                  {job.supervisor && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Supervisor: <Link href={`/users/${job.supervisor.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{job.supervisor.name}</Link></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      Staff: <Link href={`/users/${job.assignedTo.id}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{job.assignedTo.name}</Link> (
                      {job.assignedTo.role})
                    </span>
                  </div>
                  {job.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>Department: {job.department.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleEditJob}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit job details"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              {canComplete && !isArchived && (
                <button
                  onClick={() => handleArchiveJob("complete")}
                  disabled={archiving}
                  className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                  title="Mark job as complete"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete
                </button>
              )}
              {canCancel && !isArchived && (
                <button
                  onClick={() => handleArchiveJob("cancel")}
                  disabled={archiving}
                  className="flex items-center gap-2 px-3 py-2 text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                  title="Cancel this job"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDeleteJob}
                  disabled={deletingJob}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingJob ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Status Updates Timeline - Enhanced Design */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Status History
                </h2>
              </div>
              <div className="space-y-3">
                {job.statusUpdates.map((update, index) => (
                  <div key={update.id} className="relative">
                    <div className="flex gap-4">
                      {/* Timeline Line with Gradient */}
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100 dark:ring-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        {index < job.statusUpdates.length - 1 && (
                          <div className="w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-300 dark:from-blue-600 dark:to-indigo-800 mt-2 rounded-full" />
                        )}
                      </div>
                      
                      {/* Content Card */}
                      <div className="flex-1 pb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                {update.user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {update.user.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {formatTimeAgo(new Date(update.createdAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              changed status to
                            </span>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-semibold shadow-sm ${
                                update.newStatus ? getStatusColor(update.newStatus as any) : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {update.newStatus ? getStatusLabel(update.newStatus) : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({job.comments.length})
              </h2>

              {/* Comment List with enhanced mention rendering */}
              <div className="mb-6">
                <CommentsList 
                  comments={job.comments} 
                  currentUserId={session?.user?.id}
                />
              </div>

              {/* Add Comment Form with @mention autocomplete */}
              {canComment && (
                <CommentInput 
                  jobId={jobId} 
                  onCommentAdded={fetchJob}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Update Status
              </h3>
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                {getAvailableStatusOptions(session?.user?.role || "STAFF").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                </option>
              ))}
            </select>
            {session && session.user.role === "STAFF" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                To complete a job, select "06: Sent to Jack for Review" to request supervisor/manager approval.
              </p>
            )}
          </div>            {/* Job Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Job Information
              </h3>

              <div className="flex items-center gap-3">
                <Flag className={`w-5 h-5 ${getPriorityColor(job.priority as any)}`} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Priority
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {job.priority}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Due Date
                  </p>
                  <p
                    className={`font-medium ${
                      dueDateStatusObj.isOverdue
                        ? "text-red-600 dark:text-red-400"
                        : dueDateStatusObj.isDueSoon
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {formatDate(new Date(job.dueDate))}
                  </p>
                </div>
              </div>

              {job.completedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(new Date(job.completedAt))}
                    </p>
                  </div>
                </div>
              )}

              {job.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Confirm Status Change
                  </h3>
                  <p className="text-blue-100 text-sm">
                    This action will update the job status
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                  <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-sm">
                    {currentStatusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-[-90deg]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Status:</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-sm shadow-lg">
                    {pendingStatusLabel}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Are you sure you want to proceed with this status change?
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingStatus}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Confirm Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Job Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in">
            {/* Header with gradient */}
            <div className={`rounded-t-2xl p-6 ${
              archiveAction === "complete"
                ? "bg-gradient-to-r from-green-600 to-emerald-600"
                : "bg-gradient-to-r from-red-600 to-rose-600"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {archiveAction === "complete" ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {archiveAction === "complete" ? "Complete Job" : "Cancel Job"}
                  </h3>
                  <p className={archiveAction === "complete" ? "text-green-100" : "text-red-100"}>
                    {archiveAction === "complete"
                      ? "Mark this job as successfully completed"
                      : "Cancel this job and move to archive"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <strong className="text-gray-900 dark:text-white">Job:</strong> {job.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <strong className="text-gray-900 dark:text-white">Client:</strong> {job.clientName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action will move the job to the archive and notify all team members.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder={
                    archiveAction === "complete"
                      ? "Add any completion notes..."
                      : "Explain why this job is being cancelled..."
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveAction(null);
                  setArchiveReason("");
                }}
                disabled={archiving}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={archiving}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  archiveAction === "complete"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                }`}
              >
                {archiving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {archiveAction === "complete" ? "Completing..." : "Cancelling..."}
                  </span>
                ) : (
                  archiveAction === "complete" ? "Complete Job" : "Cancel Job"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Job</h2>
                    <p className="text-blue-100 text-sm mt-1">Update job details and assignments</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm({
                      title: "",
                      clientName: "",
                      description: "",
                      priority: "",
                      dueDate: "",
                      assignedToId: "",
                      managerId: "",
                      supervisorId: "",
                    });
                  }}
                  disabled={editing}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter job title"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={editing}
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={editForm.clientName}
                  onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                  placeholder="Enter client name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={editing}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter job description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  disabled={editing}
                />
              </div>

              {/* Priority and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority *
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={editing}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={editing}
                  />
                </div>
              </div>

              {/* Assignment Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Team Assignment
                </h3>

                <div className="space-y-4">
                  {/* Manager */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manager
                      {session?.user.role === "SUPERVISOR" && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Read-only)</span>
                      )}
                    </label>
                    <select
                      value={editForm.managerId}
                      onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={editing || session?.user.role === "SUPERVISOR"}
                    >
                      <option value="">Select Manager</option>
                      {users
                        .filter((u) => u.role === "MANAGER")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor
                      {session?.user.role === "SUPERVISOR" && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Read-only)</span>
                      )}
                    </label>
                    <select
                      value={editForm.supervisorId}
                      onChange={(e) => setEditForm({ ...editForm, supervisorId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={editing || session?.user.role === "SUPERVISOR"}
                    >
                      <option value="">Select Supervisor</option>
                      {users
                        .filter((u) => u.role === "SUPERVISOR")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Assigned Staff */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Staff *
                    </label>
                    <select
                      value={editForm.assignedToId}
                      onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={editing}
                    >
                      <option value="">Select Staff Member</option>
                      {users
                        .filter((u) => u.role === "STAFF")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({
                    title: "",
                    clientName: "",
                    description: "",
                    priority: "",
                    dueDate: "",
                    assignedToId: "",
                    managerId: "",
                    supervisorId: "",
                  });
                }}
                disabled={editing}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editing || !editForm.title || !editForm.clientName || !editForm.assignedToId}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
