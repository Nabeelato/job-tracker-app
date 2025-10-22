"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  XCircle,
  User,
  Building2,
  Calendar,
  Loader2,
  Search,
  FileSpreadsheet,
  Grid3X3,
  Table2,
  Filter,
} from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";

type ServiceType = "BOOKKEEPING" | "VAT" | "CESSATION_OF_ACCOUNT" | "FINANCIAL_STATEMENTS";

interface Job {
  id: string;
  jobId: string;
  title: string;
  clientName: string;
  status: string;
  priority: string;
  serviceTypes: ServiceType[];
  completedAt: string | null;
  createdAt: string;
  department: { id: string; name: string } | null;
  manager: { id: string; name: string; email: string } | null;
  supervisor: { id: string; name: string; email: string } | null;
  assignedTo: { id: string; name: string; email: string; role: string };
  assignedBy: { id: string; name: string; email: string } | null;
}

export default function CancelledJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  useEffect(() => {
    if (session) {
      fetchCancelledJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchCancelledJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        const cancelledJobs = data.filter(
          (job: Job) => job.status === "CANCELLED"
        );
        setJobs(cancelledJobs);
      }
    } catch (error) {
      console.error("Error fetching cancelled jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesServiceType =
      serviceTypeFilter === "ALL" ||
      job.serviceTypes.includes(serviceTypeFilter as ServiceType);

    const matchesPriority =
      priorityFilter === "ALL" || job.priority === priorityFilter;

    return matchesSearch && matchesServiceType && matchesPriority;
  });

  const exportToExcel = () => {
    const headers = [
      "Job ID",
      "Client Name",
      "Title",
      "Service Types",
      "Priority",
      "Department",
      "Staff",
      "Manager",
      "Supervisor",
      "Created Date",
      "Cancelled Date",
    ];

    const rows = filteredJobs.map((job) => {
      const createdDate = new Date(job.createdAt);
      const cancelledDate = job.completedAt ? new Date(job.completedAt) : null;

      return [
        job.jobId,
        `"${job.clientName}"`,
        `"${job.title}"`,
        `"${job.serviceTypes.join(", ")}"`,
        job.priority,
        job.department?.name || "",
        job.assignedTo.name,
        job.manager?.name || "",
        job.supervisor?.name || "",
        formatDate(createdDate),
        cancelledDate ? formatDate(cancelledDate) : "",
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cancelled_Jobs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                Cancelled Jobs
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredJobs.length} of {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <Table2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={exportToExcel}
              disabled={filteredJobs.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <XCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {jobs.length === 0 ? "No Cancelled Jobs" : "No Matching Jobs"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {jobs.length === 0
                ? "Cancelled jobs will appear here"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client & Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service Types
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cancelled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-sm font-mono text-red-600 dark:text-red-400 hover:underline"
                        >
                          {job.jobId}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {job.clientName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {job.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {job.serviceTypes.map((type) => (
                            <span key={type}>{getServiceTypeBadge(type)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {job.assignedTo.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {job.department?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {job.completedAt
                            ? formatDate(new Date(job.completedAt))
                            : "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-red-500 dark:hover:border-red-600"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {job.jobId}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {job.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Cancelled
                  </span>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>{job.clientName}</span>
                </div>

                {/* Service Types */}
                {job.serviceTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.serviceTypes.map((type) => (
                      <span key={type}>{getServiceTypeBadge(type)}</span>
                    ))}
                  </div>
                )}

                {/* Priority */}
                <div className="mb-3">{getPriorityBadge(job.priority)}</div>

                {/* Cancellation Date */}
                {job.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Cancelled {formatTimeAgo(new Date(job.completedAt))}
                    </span>
                  </div>
                )}

                {/* Team */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Staff:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {job.assignedTo.name}
                    </span>
                  </div>
                  {job.manager && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Manager:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.manager.name}
                      </span>
                    </div>
                  )}
                  {job.supervisor && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Supervisor:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.supervisor.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
