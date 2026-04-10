"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Users, BookOpen, Hand, FileSpreadsheet, Check, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getAttendanceSessionById, type AttendanceSession } from "@/lib/api/attendance-session";
import { listUsers } from "@/lib/api/user";
import { listAttendanceRecords } from "@/lib/api/attendance-record";
import type { User } from "@/lib/types/UserTypes";
import type { AttendanceRecord } from "@/lib/api/attendance-record";
import { getTeacherStudents } from "@/lib/dummy-data";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function SessionAttendanceMethodsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<Map<string, 'present' | 'absent'>>(new Map());

  const getDummyStatusMap = (studentIds?: Set<string>) => {
    const statusMap = new Map<string, 'present' | 'absent'>();
    getTeacherStudents().forEach((student) => {
      if (!studentIds || studentIds.has(student.id)) {
        statusMap.set(student.id, student.currentAttendance >= 75 ? 'present' : 'absent');
      }
    });
    return statusMap;
  };

  const refreshAttendanceList = async () => {
    try {
      const recordsResponse = await listAttendanceRecords({ session: sessionId, limit: 1000 });
      const recordsMap = new Map<string, AttendanceRecord>();
      const statusMap = new Map<string, 'present' | 'absent'>();
      
      recordsResponse.records.forEach((record) => {
        recordsMap.set(record.student._id, record);
        statusMap.set(record.student._id, record.status === 'present' ? 'present' : 'absent');
      });
      
      setAttendanceRecords(recordsMap);
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error("Failed to refresh attendance:", error);
      const currentStudentIds = new Set(students.map((student) => student._id!));
      setAttendanceStatus(getDummyStatusMap(currentStudentIds));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch session
        const sessionData = await getAttendanceSessionById(sessionId);
        setSession(sessionData);

        // Fetch all students (listUsers now handles fallback to dummy data)
        const usersResponse = await listUsers({ role: 'student', limit: 1000 });
        const sessionBatchId = typeof sessionData.batch === 'string' ? sessionData.batch : sessionData.batch?._id;
        const filteredStudents = usersResponse.users.filter((user) => {
          const p = (user.profile ?? {}) as any;
          const studentBatchId = typeof p.batch === 'string' ? p.batch : p.batch?._id;
          return studentBatchId === sessionBatchId;
        });
        const batchStudents = filteredStudents.length > 0 ? filteredStudents : usersResponse.users;

        setStudents(batchStudents);

        // Fetch attendance records for this session (fallback to dummy statuses)
        try {
          const recordsResponse = await listAttendanceRecords({ session: sessionId, limit: 1000 });
          const recordsMap = new Map<string, AttendanceRecord>();
          const statusMap = new Map<string, 'present' | 'absent'>();

          recordsResponse.records.forEach((record) => {
            recordsMap.set(record.student._id, record);
            statusMap.set(record.student._id, record.status === 'present' ? 'present' : 'absent');
          });

          setAttendanceRecords(recordsMap);
          if (statusMap.size > 0) {
            setAttendanceStatus(statusMap);
          } else {
            setAttendanceStatus(getDummyStatusMap(new Set(batchStudents.map((s) => s._id!))));
          }
        } catch (recordError) {
          console.warn("Using dummy attendance fallback:", recordError);
          setAttendanceRecords(new Map());
          setAttendanceStatus(getDummyStatusMap(new Set(batchStudents.map((s) => s._id!))));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setStudents([]);
        setAttendanceStatus(new Map());
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  // Auto-refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshAttendanceList();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [sessionId, refreshAttendanceList]);

  const toggleAttendance = (studentId: string) => {
    setAttendanceStatus((prev) => {
      const newStatus = new Map(prev);
      const current = newStatus.get(studentId);
      newStatus.set(studentId, current === 'present' ? 'absent' : 'present');
      return newStatus;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-56 w-full" />
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/attendance")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Choose Attendance Method</h1>
          <p className="text-muted-foreground">Select how you want to mark attendance for this session</p>
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
                <p className="text-sm text-muted-foreground">{session.batch?.name ?? "N/A"}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/dashboard/attendance/session/${sessionId}/swipe`} className="block">
          <Card className="border-2 cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Hand className="h-5 w-5 text-primary" />
                <CardTitle>Swipe Cards</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/dashboard/attendance/session/${sessionId}/csv`} className="block">
          <Card className="border-2 cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <CardTitle>CSV</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Student Attendance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Attendance List
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refreshAttendanceList} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No students found in this batch.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const studentId = student._id;
                const status = attendanceStatus.get(studentId!) || 'absent';
                const isPresent = status === 'present';
                
                return (
                  <div
                    key={studentId}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{(student.profile as any)?.adm_number || 'N/A'}</p>
                    </div>
                    <Button
                      variant={isPresent ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAttendance(studentId!)}
                      className="shrink-0 gap-1"
                    >
                      {isPresent ? (
                        <>
                          <Check className="h-4 w-4" />
                          Present
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Absent
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
