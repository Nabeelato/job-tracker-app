"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Flag,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  CheckCircle,
} from "lucide-react";
import { canCreateJobs } from "@/lib/permissions";
import { getStatusColor, getPriorityColor } from "@/lib/job-utils";
import { getDueDateStatus } from "@/lib/date-utils";
import { formatDate, formatTimeAgo } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  clientName?: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  isLate: boolean;
  assignedTo: {
    name: string;
    role: string;
  };
  assignedBy: {
    name: string;
  };
  department: {
    name: string;
    manager?: { name: string } | null;
  } | null;
  supervisor?: {
    name: string;
  } | null;
  _count: {
    comments: number;
  };
}

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

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

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((job) => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  };

  if (loading) {
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Jobs
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
              </p>
            </div>
            {session && canCreateJobs(session.user.role) && (
              <Link
                href="/jobs/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Job
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="ALL">All States</option>
                <option value="PENDING">02: RFI</option>
                <option value="IN_PROGRESS">03: Info Sent to Lahore</option>
                <option value="ON_HOLD">04: Missing Info / Chase Info</option>
                <option value="AWAITING_APPROVAL">05: Info Completed</option>
                <option value="COMPLETED">06: Sent to Jack for Review</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Create your first job to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      JOB ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Supervisor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => {
                    const getStateLabel = (status: string) => {
                      const states: { [key: string]: string } = {
                        'PENDING': '02: RFI',
                        'IN_PROGRESS': '03: Info Sent to Lahore',
                        'ON_HOLD': '04: Missing Info / Chase Info',
                        'AWAITING_APPROVAL': '05: Info Completed',
                        'COMPLETED': '06: Sent to Jack for Review',
                      };
                      return states[status] || status;
                    };

                    // Extract manager, supervisor, and staff from the job data
                    const manager = job.department?.manager?.name || job.assignedBy.name;
                    const supervisor = job.supervisor?.name || (job.assignedTo.role === 'SUPERVISOR' ? job.assignedTo.name : '-');
                    const staff = job.assignedTo.role === 'STAFF' ? job.assignedTo.name : '-';

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {/* Job ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                            #{job.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Client Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.clientName || job.department?.name || '-'}
                          </div>
                        </td>

                        {/* Job */}
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {job.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {job.description}
                            </div>
                          </div>
                        </td>

                        {/* State */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {getStateLabel(job.status)}
                          </span>
                        </td>

                        {/* Manager */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {manager}
                        </td>

                        {/* Supervisor */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {supervisor}
                        </td>

                        {/* Staff */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {staff}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
