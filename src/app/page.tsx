import Link from "next/link";
import { CheckCircle2, Users, Clock, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Job Tracking App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Streamline your team's workflow with powerful task management
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Get Started
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold border-2 border-blue-600"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8 text-blue-600" />}
            title="Task Management"
            description="Create, assign, and track jobs with ease"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-green-600" />}
            title="Role-Based Access"
            description="Admin, Manager, Supervisor, and Staff roles"
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-orange-600" />}
            title="Real-Time Updates"
            description="Stay informed with instant notifications"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
            title="Analytics"
            description="Track performance and productivity metrics"
          />
        </div>

        {/* Key Features List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Key Features
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {[
              "Job assignment and reassignment",
              "Status tracking timeline",
              "Comments and collaboration",
              "Mark as complete with approval",
              "Urgent and late status markers",
              "Department management",
              "Advanced filtering and search",
              "Email notifications",
              "File attachments",
              "Comprehensive analytics",
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
