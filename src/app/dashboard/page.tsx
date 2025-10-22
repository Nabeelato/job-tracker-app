"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Briefcase,
  Building2,
  MessageSquare,
  ArrowRight,
  Loader2,
  XCircle,
  Calendar,
} from "lucide-react";

interface DashboardStats {
  summary: {
    totalActive: number;
    totalCompleted: number;
    totalCancelled: number;
    overdue: number;
    dueSoon: number;
    completionRate: number;
    avgComments: string;
  };
  statusDistribution: {
    PENDING: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    AWAITING_APPROVAL: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  priorityDistribution: {
    URGENT: number;
    HIGH: number;
    NORMAL: number;
    LOW: number;
  };
  serviceTypeDistribution: {
    BOOKKEEPING: number;
    VAT: number;
    CESSATION_OF_ACCOUNT: number;
    FINANCIAL_STATEMENTS: number;
  };
  topUsers: Array<{
    name: string;
    count: number;
    role: string;
  }>;
  departmentStats: Array<{
    name: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session?.user?.name}! Here&apos;s your overview.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Active Jobs */}
          <Link
            href="/jobs"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.summary.totalActive}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
          </Link>

          {/* Completed Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                {stats.summary.completionRate}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.summary.totalCompleted}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed (30d rate)
            </p>
          </div>

          {/* Overdue Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              {stats.summary.overdue > 0 && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Attention!
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.summary.overdue}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Jobs</p>
          </div>

          {/* Due Soon */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.summary.dueSoon}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Due Within 7 Days
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status Distribution
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.statusDistribution).map(([status, count]) => {
                const total = Object.values(stats.statusDistribution).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const colors: { [key: string]: string } = {
                  PENDING: "bg-yellow-500",
                  IN_PROGRESS: "bg-blue-500",
                  ON_HOLD: "bg-orange-500",
                  AWAITING_APPROVAL: "bg-purple-500",
                  COMPLETED: "bg-green-500",
                  CANCELLED: "bg-red-500",
                };

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {status === "IN_PROGRESS"
                          ? "In Progress"
                          : status === "ON_HOLD"
                          ? "On Hold"
                          : status === "AWAITING_APPROVAL"
                          ? "Awaiting Approval"
                          : status.charAt(0) + status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${colors[status]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Priority Distribution
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => {
                const total = Object.values(stats.priorityDistribution).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const colors: { [key: string]: string } = {
                  URGENT: "bg-red-600",
                  HIGH: "bg-orange-500",
                  NORMAL: "bg-blue-500",
                  LOW: "bg-gray-500",
                };

                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${colors[priority]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Service Types & Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Service Type Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Service Types
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.serviceTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {type === "BOOKKEEPING"
                      ? "Bookkeeping"
                      : type === "FINANCIAL_STATEMENTS"
                      ? "Financial Statements"
                      : type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Comments/Job
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.summary.avgComments}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cancelled Jobs
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.summary.totalCancelled}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/jobs/new"
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create New Job
              </Link>
              <Link
                href="/jobs"
                className="block w-full text-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                View All Jobs
              </Link>
              <Link
                href="/reports"
                className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                View Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Top Users & Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Users by Workload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Users by Workload
            </h2>
            <div className="space-y-3">
              {stats.topUsers.length > 0 ? (
                stats.topUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {user.count} jobs
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No users with active jobs
                </p>
              )}
            </div>
          </div>

          {/* Department Workload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department Workload
            </h2>
            <div className="space-y-3">
              {stats.departmentStats.length > 0 ? (
                stats.departmentStats.map((dept, index) => {
                  const total = stats.departmentStats.reduce(
                    (sum, d) => sum + d.count,
                    0
                  );
                  const percentage = total > 0 ? (dept.count / total) * 100 : 0;

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {dept.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {dept.count} jobs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No department data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
