"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ResumeReviewClient from "@/components/ResumeReviewClient";
import Loader from "@/components/Loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    interviewsCount: number;
    assessmentsCount: number;
    averageScore: number;
    recentActivity: any[];
    totalTests: number;
    interviews?: any[];
    assessments?: any[];
  };
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => setIsInitializing(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Process data for weekly charts
  const weeklyData = useMemo(() => {
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];

    // Get all interviews and assessments with fallback
    const allInterviews = stats.interviews || [];
    const allAssessments = stats.assessments || [];

    console.log("All interviews:", allInterviews);
    console.log("All assessments:", allAssessments);
    console.log("Selected month:", selectedMonth, "Year:", selectedYear);

    // If we have data but nothing in selected month, distribute across weeks
    const hasData = allInterviews.length > 0 || allAssessments.length > 0;

    if (hasData) {
      // Group by week for the selected month
      const startOfMonth = new Date(selectedYear, selectedMonth, 1).getTime();
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getTime();

      const data = weeks.map((week, index) => {
        const weekStart = startOfMonth + index * 7 * 24 * 60 * 60 * 1000;
        const weekEnd = Math.min(
          weekStart + 7 * 24 * 60 * 60 * 1000,
          endOfMonth
        );

        const interviewsThisWeek = allInterviews.filter((interview) => {
          const completedAt = interview.completedAt;
          return completedAt >= weekStart && completedAt < weekEnd;
        }).length;

        const assessmentsThisWeek = allAssessments.filter((assessment) => {
          const completedAt = assessment.completedAt;
          return completedAt >= weekStart && completedAt < weekEnd;
        }).length;

        return {
          week,
          interviews: interviewsThisWeek,
          assessments: assessmentsThisWeek,
        };
      });

      console.log("Weekly data for selected month:", data);

      // Check if selected month has any data
      const totalInMonth = data.reduce(
        (sum, w) => sum + w.interviews + w.assessments,
        0
      );

      if (totalInMonth === 0) {
        // If no data in selected month, show message in console
        console.log("No data in selected month");
      }

      return data;
    }

    // No data at all
    return weeks.map((week) => ({
      week,
      interviews: 0,
      assessments: 0,
    }));
  }, [selectedMonth, selectedYear, stats]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loader while initializing
  if (isInitializing) {
    return <Loader size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalTests}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Interviews Taken</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.interviewsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assessments</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.assessmentsCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <h3 className="text-3xl font-bold mt-2">{stats.averageScore}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Profile</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                  placeholder="Your name"
                />
              ) : (
                <h3 className="text-xl font-semibold">{user.name}</h3>
              )}
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                  placeholder="Your phone number"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resume Review Section */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-semibold mb-6">Resume Review</h2>
        <ResumeReviewClient />
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-center justify-between p-4 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "interview"
                        ? "bg-green-500/10"
                        : "bg-blue-500/10"
                    }`}
                  >
                    {activity.type === "interview" ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {activity.type === "interview"
                        ? `Interview - ${activity.role || "Role"}`
                        : `Assessment - ${activity.section || "Section"}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {activity.type === "assessment" && (
                  <div className="text-sm font-semibold">
                    {Math.round((activity.score / activity.total) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent activity</p>
        )}
      </div>

      {/* Performance Overview */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Performance Overview</h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-md bg-background text-sm"
              aria-label="Select month"
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-md bg-background text-sm"
              aria-label="Select year"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assessments Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">
            Assessments Taken (Weekly)
          </h3>
          {weeklyData.some((w) => w.assessments > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="assessments"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Assessments"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center border rounded-md bg-muted/20">
              <p className="text-muted-foreground">
                No assessment data for the selected period
              </p>
            </div>
          )}
        </div>

        {/* Interviews Chart */}
        <div>
          <h3 className="text-lg font-medium mb-4">
            Interviews Taken (Weekly)
          </h3>
          {weeklyData.some((w) => w.interviews > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="interviews"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Interviews"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center border rounded-md bg-muted/20">
              <p className="text-muted-foreground">
                No interview data for the selected period
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
