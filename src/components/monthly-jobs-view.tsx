"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Briefcase,
  Clock,
  User,
  CheckCircle,
  MessageSquare,
  Building2,
  Loader2,
} from "lucide-react";
import { groupByMonth, getMonthLabelFromKey } from "@/lib/date-utils";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { getAllStatuses, getStatusLabel, getStatusColor } from "@/lib/status-utils";
import { getActivityStatus } from "@/lib/business-hours";
import { CustomFieldsDisplay } from "@/components/custom-fields-display";

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
  customFields?: any;
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
  _count: {
    comments: number;
  };
}

interface MonthlyJobsViewProps {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
  expandedJobId: string | null;
  timeline: Record<string, any[]>;
  loadingTimeline: Record<string, boolean>;
  selectedJobs?: Set<string>;
  onToggleSelectJob?: (jobId: string) => void;
  showCheckboxes?: boolean;
  onUserFilter?: (userId: string) => void;
}

// Use the status utility for consistent handling

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

// Get activity status indicator color for job row
const getActivityRowColor = (job: Job): string => {
  // Only show indicators for active jobs (not completed or cancelled)
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    return "hover:bg-gray-50 dark:hover:bg-gray-750";
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

export default function MonthlyJobsView({
  jobs,
  onJobClick,
  expandedJobId,
  timeline,
  loadingTimeline,
  selectedJobs,
  onToggleSelectJob,
  showCheckboxes = false,
  onUserFilter,
}: MonthlyJobsViewProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Group jobs by month based on start date
  const jobsByMonth = groupByMonth(jobs, "startedAt");

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  // Auto-expand the first (most recent) month
  if (jobsByMonth.size > 0 && expandedMonths.size === 0) {
    const firstMonth = Array.from(jobsByMonth.keys())[0];
    setExpandedMonths(new Set([firstMonth]));
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No jobs found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(jobsByMonth.entries()).map(([monthKey, monthJobs]) => {
        const isExpanded = expandedMonths.has(monthKey);
        const monthLabel = getMonthLabelFromKey(monthKey);

        return (
          <div key={monthKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Month Header */}
            <button
              onClick={() => toggleMonth(monthKey)}
              className="w-full px-3 py-2 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-gray-650 dark:hover:to-gray-700 transition-colors border-b border-blue-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {monthLabel}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {monthJobs.length} {monthJobs.length === 1 ? "job" : "jobs"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </button>

            {/* Jobs Table */}
            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <tr>
                      {showCheckboxes && (
                        <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={monthJobs.every((job) => selectedJobs?.has(job.id))}
                            onChange={() => {
                              monthJobs.forEach((job) => onToggleSelectJob?.(job.id));
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Job ID
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Service Types
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Supervisor
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <MessageSquare className="w-3.5 h-3.5 inline" />
                      </th>
                      <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {monthJobs.map((job) => (
                      <Fragment key={job.id}>
                        {/* Main Row */}
                        <tr
                          onClick={() => onJobClick(job.id)}
                          className={`cursor-pointer transition-colors ${getActivityRowColor(job)}`}
                        >
                          {showCheckboxes && (
                            <td 
                              className="px-2 py-1.5 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedJobs?.has(job.id)}
                                onChange={() => onToggleSelectJob?.(job.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          )}
                          <td className="px-2 py-1.5 text-xs font-mono font-medium text-gray-900 dark:text-white">
                            {job.jobId}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-white">
                            {job.clientName}
                          </td>
                          <td className="px-2 py-1.5 text-xs font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </td>
                          <td className="px-2 py-1.5">
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
                          <td className="px-2 py-1.5">
                            {getPriorityBadge(job.priority)}
                          </td>
                          <td className="px-2 py-1.5 text-xs">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                              {getStatusLabel(job.status)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300">
                            {job.manager?.name ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUserFilter?.(job.manager!.id);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                {job.manager.name}
                              </button>
                            ) : "N/A"}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300">
                            {job.supervisor?.name ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUserFilter?.(job.supervisor!.id);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                {job.supervisor.name}
                              </button>
                            ) : "N/A"}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300">
                            {job.assignedTo?.name ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUserFilter?.(job.assignedTo!.id);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                {job.assignedTo.name}
                              </button>
                            ) : "Unassigned"}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1.5 text-xs">
                            {job.dueDate ? (() => {
                              const dueDate = new Date(job.dueDate);
                              const today = new Date();
                              const isOverdue = dueDate < today && job.status !== "COMPLETED";
                              const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              
                              return (
                                <div className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                                  <div>{dueDate.toLocaleDateString()}</div>
                                  {isOverdue && (
                                    <div className="text-xs text-red-500">
                                      Overdue by {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? 'day' : 'days'}
                                    </div>
                                  )}
                                  {!isOverdue && daysDiff >= 0 && daysDiff <= 7 && (
                                    <div className="text-xs text-orange-500 dark:text-orange-400">
                                      {daysDiff === 0 ? 'Due today' : `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'} left`}
                                    </div>
                                  )}
                                </div>
                              );
                            })() : (
                              <span className="text-gray-400 dark:text-gray-500">No due date</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-center text-gray-600 dark:text-gray-400">
                            {job._count.comments}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-center">
                            {expandedJobId === job.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded Content Row - Timeline */}
                        {expandedJobId === job.id && (
                          <tr>
                            <td colSpan={showCheckboxes ? 14 : 13} className="px-0 py-0">
                              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-750">
                                <div className="mb-3">
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors inline-block"
                                  >
                                    View Full Details
                                  </Link>
                                </div>

                                {/* Custom Fields */}
                                {job.customFields && (
                                  <div className="mb-3">
                                    <CustomFieldsDisplay 
                                      values={job.customFields} 
                                      compact={false}
                                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                    />
                                  </div>
                                )}

                                {/* Timeline */}
                                <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-blue-600 rounded-md">
                                      <Clock className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                                      Timeline
                                    </h3>
                                  </div>

                                  {loadingTimeline[job.id] ? (
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Loading timeline...
                                    </div>
                                  ) : timeline[job.id] && timeline[job.id].length > 0 ? (
                                    <div className="space-y-2">
                                      {timeline[job.id].map((event, idx) => {
                                        // Safety checks for event properties
                                        if (!event || !event.id) return null;
                                        const userName = event.user?.name || 'Unknown User';
                                        
                                        const iconBgClass = 
                                          event.action === "COMMENT_ADDED" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                                          event.action === "STAFF_ASSIGNED" ? "bg-gradient-to-br from-green-500 to-green-600" :
                                          event.action === "COMPLETION_REQUESTED" ? "bg-gradient-to-br from-purple-500 to-purple-600" :
                                          "bg-gradient-to-br from-gray-500 to-gray-600";

                                        return (
                                          <div key={event.id} className="relative">
                                            <div className="flex gap-2">
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
                                                  <div className="w-0.5 h-full bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 mt-1" />
                                                )}
                                              </div>

                                              <div className="flex-1 pb-2">
                                                {event.action === "COMMENT_ADDED" ? (
                                                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border-l-2 border-blue-500">
                                                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">
                                                      <span className="text-blue-600 dark:text-blue-400">{userName}</span> commented:
                                                    </div>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                                                      <div className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                        {event.newValue}
                                                      </div>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">
                                                      {formatTimeAgo(new Date(event.timestamp))}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
                                                    <div className="text-xs text-gray-900 dark:text-white">
                                                      <span className="font-semibold">{userName}</span>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
