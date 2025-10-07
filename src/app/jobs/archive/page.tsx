"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  User,
  ArrowLeft,
  List,
  Grid3X3,
} from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { getStatusColor } from "@/lib/job-utils";
import { groupByMonth, getMonthLabelFromKey, getAvailableMonths } from "@/lib/date-utils";

interface Job {
  id: string;
  jobId: string;
  clientName: string;
  title: string;
  status: string;
  priority: string;
  completedAt: string | null;
  createdAt: string;
  startedAt?: string | null;
  assignedTo?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    name: string;
  };
  supervisor?: {
    id: string;
    name: string;
  };
}

export default function ArchivePage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<"grid" | "monthly">("monthly");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchArchivedJobs();
  }, []);

  const fetchArchivedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        // Filter for completed and cancelled jobs
        const archivedJobs = data.filter(
          (job: Job) => job.status === "COMPLETED" || job.status === "CANCELLED"
        );
        setJobs(archivedJobs);
      }
    } catch (error) {
      console.error("Error fetching archived jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "completed") return job.status === "COMPLETED";
    if (filter === "cancelled") return job.status === "CANCELLED";
    return true;
  }).filter((job) => {
    // Month filter
    if (monthFilter === "ALL") return true;
    const createdDate = new Date(job.createdAt);
    const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
    return monthKey === monthFilter;
  });

  // Get available months for filter based on start date
  const availableMonths = getAvailableMonths(jobs, 'startedAt');

  // Group jobs by month for monthly view based on start date
  const jobsByMonth = groupByMonth(filteredJobs, 'startedAt');

  // Auto-expand first month
  if (viewMode === "monthly" && jobsByMonth.size > 0 && expandedMonths.size === 0) {
    const firstMonth = Array.from(jobsByMonth.keys())[0];
    setExpandedMonths(new Set([firstMonth]));
  }

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/jobs"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Archive className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Archived Jobs
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View completed and cancelled jobs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completed ({jobs.filter((j) => j.status === "COMPLETED").length})
                </button>
                <button
                  onClick={() => setFilter("cancelled")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === "cancelled"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Cancelled ({jobs.filter((j) => j.status === "CANCELLED").length})
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map(({ key, label, count }) => (
                  <option key={key} value={key}>
                    {label} ({count})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("monthly")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "monthly"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  title="Monthly View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No archived jobs found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "completed"
                ? "No completed jobs yet"
                : filter === "cancelled"
                ? "No cancelled jobs yet"
                : "No archived jobs yet"}
            </p>
          </div>
        ) : viewMode === "monthly" ? (
          /* Monthly View */
          <div className="space-y-4">
            {Array.from(jobsByMonth.entries()).map(([monthKey, monthJobs]) => {
              const isExpanded = expandedMonths.has(monthKey);
              const monthLabel = getMonthLabelFromKey(monthKey);

              return (
                <div key={monthKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Month Header */}
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-gray-650 dark:hover:to-gray-700 transition-colors border-b-2 border-purple-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {monthLabel}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {monthJobs.length} {monthJobs.length === 1 ? "job" : "jobs"}
                        </p>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <CheckCircle2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Archive className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Jobs Grid */}
                  {isExpanded && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
                      {monthJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="bg-gray-50 dark:bg-gray-750 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                        >
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                                job.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {job.status === "COMPLETED" ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {job.status === "COMPLETED" ? "Completed" : "Cancelled"}
                            </span>
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {job.jobId}
                            </span>
                          </div>

                          {/* Job Info */}
                          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {job.clientName}
                          </p>

                          {/* Completion Date */}
                          {job.completedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(new Date(job.completedAt))}</span>
                            </div>
                          )}

                          {/* Team */}
                          <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {job.manager && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium">Manager:</span>
                                <span>{job.manager.name}</span>
                              </div>
                            )}
                            {job.assignedTo && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium">Staff:</span>
                                <span>{job.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      job.status === "COMPLETED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {job.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {job.status === "COMPLETED" ? "Completed" : "Cancelled"}
                  </span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {job.jobId}
                  </span>
                </div>

                {/* Job Info */}
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {job.clientName}
                </p>

                {/* Completion Date */}
                {job.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(new Date(job.completedAt))}</span>
                  </div>
                )}

                {/* Team */}
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {job.manager && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium">Manager:</span>
                      <span>{job.manager.name}</span>
                    </div>
                  )}
                  {job.assignedTo && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium">Staff:</span>
                      <span>{job.assignedTo.name}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
