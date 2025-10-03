"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { canCreateJobs } from "@/lib/permissions";
import { formatTimeAgo } from "@/lib/utils";

interface Job {
  id: string;
  jobId: string;
  clientName: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  manager?: {
    name: string;
  } | null;
  supervisor?: {
    name: string;
  } | null;
  createdAt: string;
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

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Record<string, TimelineEvent[]>>({});
  const [loadingTimeline, setLoadingTimeline] = useState<Record<string, boolean>>({});

  // For supervisors assigning staff
  const [assigningStaff, setAssigningStaff] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");

  useEffect(() => {
    fetchJobs();
    if (session?.user.role === "SUPERVISOR") {
      fetchStaffUsers();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
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
      COMPLETED: "06: Sent to Jack for Review",
    };
    return stateMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      ON_HOLD: "bg-orange-100 text-orange-800",
      AWAITING_APPROVAL: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Jobs
          </h1>
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

        {/* Jobs List with Accordion */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No jobs found
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
              >
                {/* Job Header - Clickable to expand */}
                <div
                  onClick={() => toggleExpand(job.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                      {/* Job ID */}
                      <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {job.jobId}
                      </div>

                      {/* Client Name */}
                      <div className="text-sm text-gray-900 dark:text-white">
                        {job.clientName}
                      </div>

                      {/* Job Title */}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.title}
                      </div>

                      {/* State */}
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStateLabel(job.status)}
                        </span>
                      </div>

                      {/* Manager/Supervisor/Staff */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>M: {job.manager?.name || "N/A"}</div>
                        <div>S: {job.supervisor?.name || "N/A"}</div>
                        <div>Staff: {job.assignedTo?.name || "Unassigned"}</div>
                      </div>

                      {/* Comments Count */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        {job._count.comments}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="ml-4">
                      {expandedJobId === job.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Timeline & Actions */}
                {expandedJobId === job.id && (
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
                              >
                                <option value="">Select staff...</option>
                                {staffUsers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => assignStaffToJob(job.id)}
                                disabled={!selectedStaff}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                Assign
                              </button>
                              <button
                                onClick={() => {
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
                              onClick={() => setAssigningStaff(job.id)}
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
                          onClick={() => requestCompletion(job.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Request Completion
                        </button>
                      )}

                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        View Details
                      </Link>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Timeline
                      </h3>

                      {loadingTimeline[job.id] ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading timeline...
                        </div>
                      ) : timeline[job.id] && timeline[job.id].length > 0 ? (
                        <div className="space-y-3">
                          {timeline[job.id].map((event) => (
                            <div key={event.id} className="flex gap-3">
                              <div className="flex-shrink-0">
                                {event.action === "COMMENT_ADDED" ? (
                                  <MessageSquare className="w-5 h-5 text-blue-500" />
                                ) : event.action === "STAFF_ASSIGNED" ? (
                                  <User className="w-5 h-5 text-green-500" />
                                ) : event.action === "COMPLETION_REQUESTED" ? (
                                  <CheckCircle className="w-5 h-5 text-purple-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  <span className="font-medium">{event.user.name}</span>
                                  {" "}
                                  {event.action === "JOB_CREATED" && "created this job"}
                                  {event.action === "COMMENT_ADDED" && "added a comment"}
                                  {event.action === "STAFF_ASSIGNED" && `assigned to ${event.newValue}`}
                                  {event.action === "COMPLETION_REQUESTED" && "requested completion"}
                                  {event.action.includes("STATUS") && `changed status to ${event.newValue}`}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatTimeAgo(new Date(event.timestamp))}
                                </div>
                                {event.action === "COMMENT_ADDED" && event.newValue && (
                                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded p-2">
                                    {event.newValue}
                                  </div>
                                )}
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
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
