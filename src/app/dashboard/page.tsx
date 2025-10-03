import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {session.user.name}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {session.user.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats Cards */}
          <StatCard
            title="Total Jobs"
            value="0"
            description="All assigned jobs"
            color="blue"
          />
          <StatCard
            title="In Progress"
            value="0"
            description="Currently active"
            color="yellow"
          />
          <StatCard
            title="Completed"
            value="0"
            description="Successfully finished"
            color="green"
          />
          <StatCard
            title="Overdue"
            value="0"
            description="Past deadline"
            color="red"
          />
        </div>

        {/* Role-specific content */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {session.user.role} Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is your {session.user.role.toLowerCase()} dashboard. 
            Job listings and management features will be displayed here.
          </p>
          
          <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Authentication working</p>
            <p>✅ Role-based access control active</p>
            <p>✅ Session management configured</p>
            <p>🚧 Job management features - Coming next!</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  color,
}: {
  title: string
  value: string
  description: string
  color: "blue" | "yellow" | "green" | "red"
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  }

  const textColors = {
    blue: "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
  }

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {title}
      </p>
      <p className={`text-3xl font-bold mt-2 ${textColors[color]}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {description}
      </p>
    </div>
  )
}
