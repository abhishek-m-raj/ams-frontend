"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Clock, Calendar } from "lucide-react";
import GreetingHeader from "@/components/student/greeting-header";
import ClassAttendanceOverview from "@/components/teacher/class-attendance-overview";
import TeacherNotifications from "@/components/teacher/teacher-notifications";
import MyClasses from "@/components/teacher/my-classes";
import { format } from "date-fns";
import { listAttendanceSessions, type AttendanceSession } from "@/lib/api/attendance-session";
import Link from "next/link";

const dummyAttendanceData = [
    { className: "Data Structures", classCode: "CS301", totalClasses: 45, averageAttendance: 84, trend: "up" as const },
    { className: "Database Management", classCode: "CS302", totalClasses: 40, averageAttendance: 88, trend: "up" as const },
    { className: "Operating Systems", classCode: "CS303", totalClasses: 42, averageAttendance: 67, trend: "down" as const },
    { className: "Computer Networks", classCode: "CS304", totalClasses: 38, averageAttendance: 76, trend: "stable" as const },
];

const dummyNotifications = [
    {
        id: "1",
        title: "Mid-Semester Exam Schedule",
        message: "Exams will be conducted from Jan 25-30. Please prepare accordingly.",
        type: "announcement" as const,
        postedBy: "Dr. John Doe",
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        targetClass: "CS301",
    },
    {
        id: "2",
        title: "Lab Session Rescheduled",
        message: "Tomorrow's lab is moved to 2:00 PM.",
        type: "warning" as const,
        postedBy: "Dr. John Doe",
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
];

export default function TeacherHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodaySessions();
    }, []);

    const loadTodaySessions = async () => {
        setLoading(true);
        try {
            const today = format(new Date(), "yyyy-MM-dd");
            const data = await listAttendanceSessions({
                limit: 10,
            });
            setSessions(data.sessions);
        } catch (error) {
            console.error("Failed to load sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSessionTypeBadge = (type: string) => {
        const variants = {
            regular: "default",
            extra: "secondary",
            practical: "outline",
        } as const;
        return variants[type as keyof typeof variants] || "default";
    };

    return (
        <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
            {/* Greeting Header */}
            <GreetingHeader userName={user?.first_name || user?.name || "Teacher"} />

            {/* My Classes Section - Quick Start */}
            <MyClasses onSessionCreated={loadTodaySessions} />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Analytics */}
                <div className="space-y-6">
                    <ClassAttendanceOverview attendance={dummyAttendanceData} />
                </div>

                {/* Right Column - Notifications */}
                <div className="space-y-6">
                    <TeacherNotifications
                        notifications={dummyNotifications}
                        teacherName={user?.first_name || user?.name || "Teacher"}
                    />
                </div>
            </div>
        </div>
    );
}
