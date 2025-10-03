"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Calculator,
  FileText,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import { canCreateJobs } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NewJobPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    jobId: "",
    clientName: "",
    title: "",
    managerId: "", // For ADMIN to select manager
    supervisorId: "",
    startedAt: "",
    dueDate: "", // NEW: Due date field
    priority: "NORMAL",
    serviceTypes: [] as string[],
  });

  const toggleServiceType = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(st => st !== serviceType)
        : [...prev.serviceTypes, serviceType]
    }));
  };

  useEffect(() => {
    if (session && !canCreateJobs(session.user.role)) {
      router.push("/dashboard");
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare payload based on user role
      const payload: any = {
        ...formData
      };

      // If user is ADMIN, they can specify managerId
      // If user is MANAGER/SUPERVISOR, backend will use their ID as manager
      if (session?.user.role !== 'ADMIN') {
        delete payload.managerId; // Let backend set it automatically
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      router.push(`/jobs/${data.id}`);
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Job
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Fill in the details to create a new job
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Job ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job ID *
            </label>
            <input
              type="text"
              required
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., JOB-001"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., ABC Corporation"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Update employee database"
            />
          </div>

          {/* Manager Selection - Only for ADMIN */}
          {session?.user.role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To Manager *
              </label>
              <select
                required
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select manager</option>
                {users.filter(u => u.role === 'MANAGER').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select which manager should oversee this job
              </p>
            </div>
          )}

          {/* Supervisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To (Supervisor) *
            </label>
            <select
              required
              value={formData.supervisorId}
              onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select supervisor</option>
              {users.filter(u => u.role === 'SUPERVISOR').map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Supervisor will assign this job to a staff member
            </p>
          </div>

          {/* Job Started Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Started Date
            </label>
            <input
              type="date"
              value={formData.startedAt}
              onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              When did work on this job begin? (Optional)
            </p>
          </div>

          {/* Due Date - NEW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              When should this job be completed?
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority *
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Service Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Service Types * (Select at least one)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                <input
                  type="checkbox"
                  checked={formData.serviceTypes.includes('BOOKKEEPING')}
                  onChange={() => toggleServiceType('BOOKKEEPING')}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Bookkeeping</span>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-50 dark:has-[:checked]:bg-green-900/20">
                <input
                  type="checkbox"
                  checked={formData.serviceTypes.includes('VAT')}
                  onChange={() => toggleServiceType('VAT')}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">VAT</span>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 dark:has-[:checked]:bg-purple-900/20">
                <input
                  type="checkbox"
                  checked={formData.serviceTypes.includes('AUDIT')}
                  onChange={() => toggleServiceType('AUDIT')}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900 dark:text-white">Audit</span>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                <input
                  type="checkbox"
                  checked={formData.serviceTypes.includes('FINANCIAL_STATEMENTS')}
                  onChange={() => toggleServiceType('FINANCIAL_STATEMENTS')}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                />
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900 dark:text-white">Financial Statements</span>
              </label>
            </div>
            {formData.serviceTypes.length === 0 && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Please select at least one service type
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/jobs"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || formData.serviceTypes.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
