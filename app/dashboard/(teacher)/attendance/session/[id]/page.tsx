"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Users, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { getAttendanceSessionById, type AttendanceSession } from "@/lib/api/attendance-session";

export default function SessionAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const data = await getAttendanceSessionById(sessionId);
        setSession(data);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      void loadSession();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/attendance")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Attendance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSessionTypeBadge = (type: string) => {
    const variants = {
      regular: "default",
      extra: "secondary",
      practical: "outline",
    } as const;
    return variants[type as keyof typeof variants] || "default";
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/attendance")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for this session</p>
        </div>
      </div>

      {/* Session Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3">
              <div>
                <CardTitle className="text-xl md:text-2xl">{session.subject.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{session.subject.code}</p>
              </div>
              <Badge variant={getSessionTypeBadge(session.session_type)} className="w-fit">
                {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Batch */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Batch</p>
                <p className="text-sm text-muted-foreground">{session.batch.name}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.start_time), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.start_time), "hh:mm a")} -{" "}
                  {format(new Date(session.end_time), "hh:mm a")}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {session.hours_taken} {session.hours_taken === 1 ? "hour" : "hours"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Marking (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Attendance Marking Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              Student list and attendance marking features will be available soon
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard/attendance")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Classes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
