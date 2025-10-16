"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  FileSpreadsheet,
  LayoutDashboard,
  CheckSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import NotificationsDropdown from "./notifications-dropdown";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Don't show navbar on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Jobs",
      href: "/jobs",
      icon: Briefcase,
      show: true,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      show: true,
    },
    {
      name: "Completed",
      href: "/jobs/completed",
      icon: CheckCircle,
      show: true,
    },
    {
      name: "Cancelled",
      href: "/jobs/cancelled",
      icon: XCircle,
      show: true,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileSpreadsheet,
      show: true,
    },
    {
      name: "Admin Panel",
      href: "/admin",
      icon: Shield,
      show: session?.user.role === "ADMIN",
    },
  ];

  if (!session) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-3">
        <div className="flex items-center justify-between h-12">
          {/* Logo/Brand */}
          <Link
            href="/jobs"
            className="flex items-center gap-1.5 text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block">Job Tracker</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks
              .filter((link) => link.show)
              .map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.name}
                  </Link>
                );
              })}
          </div>

          {/* Right Side: Notifications + Theme Toggle + User Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationsDropdown />

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Desktop User Profile Dropdown */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {session.user.role}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${
                    profileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-20">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {session.user.email}
                      </p>
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px] font-medium">
                        {session.user.role}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href={`/users/${session.user.id}`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="text-xs">My Profile</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-xs">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700">
            {/* Navigation Links */}
            <div className="space-y-0.5 mb-2">
              {navLinks
                .filter((link) => link.show)
                .map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  );
                })}
            </div>

            {/* User Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-0.5">
              <Link
                href={`/users/${session.user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs font-medium">{session.user.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    View Profile
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
