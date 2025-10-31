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

    // Get assessments only
    const allAssessments = stats.assessments || [];

    console.log("=== ASSESSMENT GRAPH DEBUG ===");
    console.log("All assessments:", allAssessments);
    console.log("Selected month:", selectedMonth, "Year:", selectedYear);

    if (allAssessments.length === 0) {
      console.log("❌ No assessments at all");
      return weeks.map((week) => ({
        week,
        interviews: 0,
        assessments: 0,
      }));
    }

    // Filter assessments for the selected month/year by comparing Date values directly
    const assessmentsInMonth = allAssessments.filter((assessment) => {
      const date = new Date(assessment.completedAt);
      const assessmentMonth = date.getMonth();
      const assessmentYear = date.getFullYear();
      const matches =
        assessmentMonth === selectedMonth && assessmentYear === selectedYear;

      if (matches) {
        console.log(`✓ Assessment in selected month:`, {
          section: assessment.section,
          date: date.toLocaleDateString(),
          completedAt: assessment.completedAt,
        });
      }

      return matches;
    });

    console.log(
      `Found ${assessmentsInMonth.length} assessments in ${
        [
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
        ][selectedMonth]
      } ${selectedYear}`
    );

    // Group assessments by week number (based on day of month)
    const data = weeks.map((week, weekIndex) => {
      const assessmentsThisWeek = assessmentsInMonth.filter((assessment) => {
        const date = new Date(assessment.completedAt);
        const dayOfMonth = date.getDate();

        // Determine which week this day falls into
        // Week 1: days 1-7, Week 2: days 8-14, Week 3: days 15-21, Week 4: days 22-end
        const assessmentWeekIndex = Math.min(
          Math.floor((dayOfMonth - 1) / 7),
          3
        );

        const inWeek = assessmentWeekIndex === weekIndex;

        if (inWeek) {
          console.log(
            `  ✓ ${week}: ${assessment.section} on day ${dayOfMonth}`
          );
        }

        return inWeek;
      }).length;

      return {
        week,
        interviews: 0,
        assessments: assessmentsThisWeek,
      };
    });

    console.log("Final weekly data:", data);

    return data;
  }, [selectedMonth, selectedYear, stats.assessments]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.assessmentsCount}
              </h3>
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
        <h2 className="text-2xl font-semibold mb-6">Recent Assessments</h2>
        {stats.recentActivity.filter((a) => a.type === "assessment").length >
        0 ? (
          <div className="space-y-4">
            {stats.recentActivity
              .filter((activity) => activity.type === "assessment")
              .map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center justify-between p-4 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
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
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.section || "Assessment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {Math.round((activity.score / activity.total) * 100)}%
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No assessments completed yet</p>
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
        <div key={`chart-${selectedMonth}-${selectedYear}`}>
          <h3 className="text-lg font-medium mb-4">
            Assessments Taken (Weekly) -{" "}
            {
              [
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
              ][selectedMonth]
            }{" "}
            {selectedYear}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={weeklyData}
              key={`line-${selectedMonth}-${selectedYear}`}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />
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
          {!weeklyData.some((w) => w.assessments > 0) && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              No assessment data for the selected period. Complete assessments
              to see your progress!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
