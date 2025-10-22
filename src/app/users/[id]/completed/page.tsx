"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Calendar,
  Briefcase,
  CheckCircle,
  Filter,
  Loader2,
  FileSpreadsheet,
  Clock,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CompletedJob {
  id: string;
  jobId: string;
  clientName: string;
  title: string;
  status: string;
  priority: string;
  serviceTypes: string[];
  completedAt: string;
  dueDate: string;
  createdAt: string;
  assignedBy: {
    name: string;
  };
  department: {
    name: string;
  } | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: {
    name: string;
  } | null;
}

export default function UserCompletionReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  useEffect(() => {
    if (session) {
      fetchUserData();
      fetchCompletedJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, dateFilter, serviceTypeFilter]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchCompletedJobs = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/completed-jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        (job) => new Date(job.completedAt) >= filterDate
      );
    }

    // Service type filter
    if (serviceTypeFilter !== "all") {
      filtered = filtered.filter((job) =>
        job.serviceTypes?.includes(serviceTypeFilter)
      );
    }

    setFilteredJobs(filtered);
  };

  const exportToExcel = () => {
    if (!user || filteredJobs.length === 0) return;

    // Create CSV content
    const headers = [
      "Job ID",
      "Client Name",
      "Title",
      "Service Types",
      "Priority",
      "Department",
      "Assigned By",
      "Created Date",
      "Due Date",
      "Completed Date",
      "Days to Complete",
    ];

    const rows = filteredJobs.map((job) => {
      const createdDate = new Date(job.createdAt);
      const completedDate = new Date(job.completedAt);
      const daysToComplete = Math.ceil(
        (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return [
        job.jobId,
        job.clientName,
        job.title,
        job.serviceTypes?.join(", ") || "N/A",
        job.priority,
        job.department?.name || "N/A",
        job.assignedBy?.name || "N/A",
        formatDate(job.createdAt),
        formatDate(job.dueDate),
        formatDate(job.completedAt),
        daysToComplete.toString(),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${user.name.replace(/\s+/g, "_")}_Completed_Jobs_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getServiceTypeBadge = (serviceType: string) => {
    const colors: Record<string, string> = {
      BOOKKEEPING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      VAT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      CESSATION_OF_ACCOUNT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      FINANCIAL_STATEMENTS:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };

    const labels: Record<string, string> = {
      BOOKKEEPING: "Bookkeeping",
      VAT: "VAT",
      CESSATION_OF_ACCOUNT: "Cessation of Account",
      FINANCIAL_STATEMENTS: "Financial Statements",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[serviceType] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[serviceType] || serviceType}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      NORMAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[priority] || "bg-gray-100 text-gray-800"
        }`}
      >
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/users/${userId}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Completion Report
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {user.role}
                  </span>
                  {user.department && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {user.department.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={filteredJobs.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {filteredJobs.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All Time Total
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {jobs.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Completion
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {filteredJobs.length > 0
                    ? Math.round(
                        filteredJobs.reduce((acc, job) => {
                          const days = Math.ceil(
                            (new Date(job.completedAt).getTime() -
                              new Date(job.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return acc + days;
                        }, 0) / filteredJobs.length
                      )
                    : 0}{" "}
                  days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileSpreadsheet className="w-4 h-4 inline mr-1" />
                Service Type
              </label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Service Types</option>
                <option value="BOOKKEEPING">Bookkeeping</option>
                <option value="VAT">VAT</option>
                <option value="CESSATION_OF_ACCOUNT">Cessation of Account</option>
                <option value="FINANCIAL_STATEMENTS">Financial Statements</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client & Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Service Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Completed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No completed jobs found
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const daysToComplete = Math.ceil(
                      (new Date(job.completedAt).getTime() -
                        new Date(job.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {job.jobId}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {job.clientName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {job.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {job.serviceTypes && job.serviceTypes.length > 0 ? (
                              job.serviceTypes.map((type) => (
                                <div key={type}>{getServiceTypeBadge(type)}</div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getPriorityBadge(job.priority)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {job.department?.name || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(job.completedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {daysToComplete} day{daysToComplete !== 1 ? "s" : ""}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
