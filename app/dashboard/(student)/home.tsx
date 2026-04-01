"use client";

import { useAuth } from "@/lib/auth-context";
import GreetingHeader from "@/components/student/greeting-header";
import AttendanceOverview from "@/components/student/attendance-overview";
import MarksOverview from "@/components/student/marks-overview";
import NotificationsList from "@/components/student/notifications-list";

// TODO: Replace with actual API calls
const dummyData = {
  attendance: [
    { subjectName: "Data Structures", totalClasses: 45, attendedClasses: 38, percentage: 84 },
    { subjectName: "Database Management", totalClasses: 40, attendedClasses: 32, percentage: 80 },
    { subjectName: "Operating Systems", totalClasses: 42, attendedClasses: 28, percentage: 67 },
    { subjectName: "Computer Networks", totalClasses: 38, attendedClasses: 25, percentage: 66 },
  ],
  marks: [
    { subjectName: "Data Structures", marksObtained: 85, totalMarks: 100, percentage: 85 },
    { subjectName: "Database Management", marksObtained: 78, totalMarks: 100, percentage: 78 },
    { subjectName: "Operating Systems", marksObtained: 72, totalMarks: 100, percentage: 72 },
    { subjectName: "Computer Networks", marksObtained: 88, totalMarks: 100, percentage: 88 },
  ],
  assignments: [
    {
      id: "1",
      title: "Binary Search Tree Implementation",
      subjectName: "Data Structures",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      description: "Implement BST with insert, delete, and search operations",
      status: "pending" as const,
    },
    {
      id: "2",
      title: "SQL Query Optimization",
      subjectName: "Database Management",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      description: "Analyze and optimize given SQL queries",
      status: "pending" as const,
    },
    {
      id: "3",
      title: "Process Scheduling Algorithms",
      subjectName: "Operating Systems",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: "Compare FCFS, SJF, and Round Robin",
      status: "overdue" as const,
    },
  ],
  notifications: [
    {
      id: "1",
      title: "Mid-Semester Exam Schedule Released",
      message: "Mid-semester exams will be conducted from December 20-27. Check your timetable for details.",
      type: "announcement" as const,
      postedBy: "Dr. Sarah Johnson",
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
    },
    {
      id: "2",
      title: "Lab Session Rescheduled",
      message: "Tomorrow's Database Lab is rescheduled to 2:00 PM instead of 10:00 AM.",
      type: "warning" as const,
      postedBy: "Prof. Michael Chen",
      postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: false,
    },
    {
      id: "3",
      title: "Library Books Due",
      message: "Your borrowed books are due on December 15. Please return or renew them.",
      type: "info" as const,
      postedBy: "Library Department",
      postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
    },
  ],
};

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      {/* Greeting Header */}
      <GreetingHeader userName={user?.first_name || user?.name || "Student"} />
      

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <AttendanceOverview attendance={dummyData.attendance} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <NotificationsList notifications={dummyData.notifications} />
        </div>
      </div>
    </div>
  );
}