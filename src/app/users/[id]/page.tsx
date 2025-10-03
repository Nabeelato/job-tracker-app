"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  Briefcase,
  Award,
  TrendingUp,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  totalJobsCreated: number;
  totalJobsAssigned: number;
  totalJobsManaged: number;
  totalJobsSupervised: number;
  completedAsStaff: number;
  completedAsManager: number;
  completedAsSupervisor: number;
  cancelledAsManager: number;
  activeJobs: number;
  totalCompleted: number;
  completionRate: number;
}

export default function UserProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User Not Found
          </h2>
          <Link
            href="/jobs"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Return to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "MANAGER":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "SUPERVISOR":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "STAFF":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Profile
              </h1>
            </div>
          </div>
          <Link
            href={`/users/${userId}/completed`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Completion Report
          </Link>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {stats.user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.user.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                    stats.user.role
                  )}`}
                >
                  {stats.user.role}
                </span>
              </div>

              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{stats.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {formatDate(new Date(stats.user.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Completed */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8" />
              <div className="text-3xl font-bold">{stats.totalCompleted}</div>
            </div>
            <h3 className="text-lg font-semibold">Total Completed</h3>
            <p className="text-green-100 text-sm">All roles combined</p>
          </div>

          {/* Active Jobs */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Briefcase className="w-8 h-8" />
              <div className="text-3xl font-bold">{stats.activeJobs}</div>
            </div>
            <h3 className="text-lg font-semibold">Active Jobs</h3>
            <p className="text-blue-100 text-sm">Currently assigned</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <div className="text-3xl font-bold">{stats.completionRate}%</div>
            </div>
            <h3 className="text-lg font-semibold">Completion Rate</h3>
            <p className="text-purple-100 text-sm">As staff member</p>
          </div>

          {/* Total Jobs */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8" />
              <div className="text-3xl font-bold">
                {stats.totalJobsAssigned + stats.totalJobsManaged + stats.totalJobsSupervised}
              </div>
            </div>
            <h3 className="text-lg font-semibold">Total Involved</h3>
            <p className="text-orange-100 text-sm">All job involvements</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* As Staff Member */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-blue-600" />
              As Staff Member
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Assigned Jobs
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalJobsAssigned}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Completed Jobs
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.completedAsStaff}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Active Jobs
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.activeJobs}
                </span>
              </div>
            </div>
          </div>

          {/* As Manager */}
          {(stats.user.role === "MANAGER" || stats.user.role === "ADMIN") && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                As Manager
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Managed Jobs
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalJobsManaged}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Completed Jobs
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.completedAsManager}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cancelled Jobs
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {stats.cancelledAsManager}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* As Supervisor */}
          {(stats.user.role === "SUPERVISOR" || stats.user.role === "ADMIN" || stats.user.role === "MANAGER") && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-green-600" />
                As Supervisor
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Supervised Jobs
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalJobsSupervised}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Completed Jobs
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.completedAsSupervisor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Job Creation Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-600" />
              Job Creation
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Jobs Created
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.totalJobsCreated}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
