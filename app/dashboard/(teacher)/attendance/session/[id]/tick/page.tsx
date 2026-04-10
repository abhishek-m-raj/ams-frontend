"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Users, BookOpen, Check, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { getAttendanceSessionById, type AttendanceSession } from "@/lib/api/attendance-session";
import { createBulkAttendanceRecords, type AttendanceStatus } from "@/lib/api/attendance-record";
import { listUsers, type User } from "@/lib/api/user";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function TickAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [markedStatuses, setMarkedStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [history, setHistory] = useState<Array<{ studentId: string; previous?: AttendanceStatus }>>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadBatchStudents = useCallback(async (batchId: string) => {
    setLoadingStudents(true);
    try {
      const batchStudents: User[] = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await listUsers({ role: "student", page, limit: 100 });
        totalPages = response.pagination.totalPages;

        const filtered = response.users.filter((student) => {
          const p = (student.profile ?? {}) as any;
          const sBatchId = typeof p.batch === 'string' ? p.batch : p.batch?._id;
          return sBatchId === batchId;
        });
        batchStudents.push(...filtered);
        page += 1;
      }

      setStudents(batchStudents);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttendanceSessionById(sessionId);
      setSession(data);
      await loadBatchStudents(data.batch._id);
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  }, [loadBatchStudents, sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [loadSession, sessionId]);

  const markStudent = (studentId: string, status: AttendanceStatus) => {
    setMarkedStatuses((prev) => {
      const previous = prev[studentId];
      setHistory((historyPrev) => [...historyPrev, { studentId, previous }]);
      setSaveSuccess(false);
      return { ...prev, [studentId]: status };
    });
  };

  const undoLast = () => {
    const lastAction = history[history.length - 1];
    if (!lastAction) return;

    setHistory((prev) => prev.slice(0, -1));
    setMarkedStatuses((prev) => {
      const next = { ...prev };
      if (lastAction.previous) {
        next[lastAction.studentId] = lastAction.previous;
      } else {
        delete next[lastAction.studentId];
      }
      return next;
    });
    setSaveSuccess(false);
  };

  const submitAttendance = async () => {
    if (!session || students.length === 0) return;

    const records = students.map((student) => ({
      student: student._id!,
      status: markedStatuses[student._id!] ?? "absent",
    }));

    setSaving(true);
    try {
      await createBulkAttendanceRecords({
        session: session._id,
        records,
      });
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert(error instanceof Error ? error.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(markedStatuses).filter((status) => status === "present").length;
  const absentCount = Object.values(markedStatuses).filter((status) => status === "absent").length;
  const unmarkedCount = Math.max(students.length - Object.keys(markedStatuses).length, 0);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-80 w-full" />
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/attendance/session/${sessionId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tick Attendance</h1>
          <p className="text-muted-foreground">Mark students by ticking present or absent in a list</p>
        </div>
      </div>

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
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Batch</p>
                <p className="text-sm text-muted-foreground">{session.batch.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{format(new Date(session.start_time), "MMM dd, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.start_time), "hh:mm a")} - {format(new Date(session.end_time), "hh:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">{session.hours_taken} {session.hours_taken === 1 ? "hour" : "hours"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Tick List</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Unmarked students will be saved as absent.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Present: {presentCount}</Badge>
              <Badge variant="outline">Absent: {absentCount}</Badge>
              <Badge variant="outline">Unmarked: {unmarkedCount}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No students found for this batch.</div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const status = markedStatuses[student._id!];
                return (
                  <div
                    key={student._id!}
                    className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Adm No: {(student.profile as any)?.adm_number ?? 'N/A'}</span>
                        <span>Dept: {(student.profile as any)?.department ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={status === "absent" ? "destructive" : "outline"}
                        onClick={() => markStudent(student._id!, "absent")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Absent
                      </Button>
                      <Button
                        type="button"
                        variant={status === "present" ? "default" : "outline"}
                        onClick={() => markStudent(student._id!, "present")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Present
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={undoLast} disabled={history.length === 0 || saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Undo Last
            </Button>
            <Button onClick={submitAttendance} disabled={saving || students.length === 0}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>

          {saveSuccess && (
            <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              Attendance has been saved successfully.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
