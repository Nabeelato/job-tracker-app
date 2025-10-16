"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  PlusCircle, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  User, 
  Calendar,
  Filter,
  TrendingUp,
  Building2,
  Timer,
  Play,
  AlertCircle
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  clientName: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  startedAt: string | null;
  completedAt: string | null;
  timeSpentMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  todayTotal: number;
  completionRate: number;
  totalTimeSpentMinutes: number;
  totalTimeSpentHours: number;
  avgTimePerTaskMinutes: number;
  tasksByClient: Array<{ clientName: string; count: number }>;
}

export default function DailyTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", description: "", clientName: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterClient, setFilterClient] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [viewingUserHistory, setViewingUserHistory] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const isManager = session?.user?.role === "MANAGER";
  const canDelete = isAdmin || isManager;

  useEffect(() => {
    fetchTasks();
    fetchStats();
    if (canDelete) {
      fetchUsers();
    }
  }, [filterStatus, filterDate, filterClient, selectedUser, viewingUserHistory]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterDate) params.append("date", filterDate);
      if (filterClient) params.append("clientName", filterClient);
      if (selectedUser) params.append("userId", selectedUser);
      if (viewingUserHistory) params.append("userId", viewingUserHistory);
      if (canDelete && !selectedUser && !viewingUserHistory) {
        params.append("showAll", "true");
      }

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append("userId", selectedUser);
      if (viewingUserHistory) params.append("userId", viewingUserHistory);

      const response = await fetch(`/api/tasks/stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        setNewTask({ title: "", description: "", clientName: "" });
        setShowAddForm(false);
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-3 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Daily Tasks
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your daily work activities with time tracking
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.todayTotal}</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
                <Circle className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                </div>
                <Play className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Done</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalTimeSpentHours}h</p>
                </div>
                <Timer className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Top Clients - Show if there's data */}
        {stats && stats.tasksByClient.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Top Clients by Task Count
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.tasksByClient.slice(0, 5).map((client) => (
                <button
                  key={client.clientName}
                  onClick={() => setFilterClient(client.clientName)}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {client.clientName} ({client.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Add Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <Filter className="w-4 h-4 text-gray-400" />
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Filter by date"
              />

              <input
                type="text"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                placeholder="Filter by client..."
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40"
              />

              {canDelete && (
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setViewingUserHistory(null);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}

              {(filterStatus !== "all" || filterDate || filterClient || selectedUser || viewingUserHistory) && (
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterDate("");
                    setFilterClient("");
                    setSelectedUser("");
                    setViewingUserHistory(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {!viewingUserHistory && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Task
              </button>
            )}
          </div>

          {/* Add Task Form */}
          {showAddForm && (
            <form onSubmit={handleAddTask} className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Task title (e.g., Punching invoices for NSA Communications)"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Client name (e.g., NSA Communications)"
                  value={newTask.clientName}
                  onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTask({ title: "", description: "", clientName: "" });
                    }}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* User History Header */}
        {viewingUserHistory && tasks.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Viewing task history for: {tasks[0]?.user?.name}
                </span>
              </div>
              <button
                onClick={() => setViewingUserHistory(null)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Back to all tasks
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No tasks found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create your first task to get started tracking your daily work!
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                          {task.title}
                        </h3>
                        {task.clientName && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
                            <Building2 className="w-3 h-3" />
                            {task.clientName}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium whitespace-nowrap ${getStatusBadge(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => setViewingUserHistory(task.userId)}
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <User className="w-3 h-3" />
                        {task.user.name}
                      </button>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      {task.status === "IN_PROGRESS" && task.startedAt && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Clock className="w-3 h-3" />
                          Started {formatTimeAgo(new Date(task.startedAt))}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {task.timeSpentMinutes && task.timeSpentMinutes > 0 && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                          <Timer className="w-3 h-3" />
                          {formatDuration(task.timeSpentMinutes)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {task.userId === session?.user?.id && task.status !== "COMPLETED" && (
                      <>
                        {task.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, "IN_PROGRESS")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Start Task"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(task.id, "COMPLETED")}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Average Time Info */}
        {stats && stats.avgTimePerTaskMinutes > 0 && (
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">
                Average time per completed task: {formatDuration(stats.avgTimePerTaskMinutes)}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
