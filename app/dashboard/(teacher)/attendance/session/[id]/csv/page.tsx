"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Calendar, Clock, FileSpreadsheet, CheckCircle2, CircleAlert } from "lucide-react";
import { format } from "date-fns";
import { getAttendanceSessionById, type AttendanceSession } from "@/lib/api/attendance-session";
import { createBulkAttendanceRecords, type AttendanceStatus } from "@/lib/api/attendance-record";
import { listUsers } from "@/lib/api/user";
import type { User } from "@/lib/types/UserTypes";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function CsvAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [mode, setMode] = useState<"present" | "absent">("present");
  const [rollInput, setRollInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const normalizedRollMap = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      const p = (student.profile ?? {}) as any;
      const roll = p.adm_number?.trim();
      if (!roll || !student._id) return;
      map.set(roll.toLowerCase(), student._id);
    });
    return map;
  }, [students]);

  const parsedRolls = useMemo(() => {
    return rollInput
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [rollInput]);

  const uniqueParsedRolls = useMemo(() => {
    const unique = new Set<string>();
    parsedRolls.forEach((roll) => unique.add(roll.toLowerCase()));
    return unique;
  }, [parsedRolls]);

  const matchingStudentIds = useMemo(() => {
    const ids = new Set<string>();
    uniqueParsedRolls.forEach((roll) => {
      const studentId = normalizedRollMap.get(roll);
      if (studentId) ids.add(studentId);
    });
    return ids;
  }, [normalizedRollMap, uniqueParsedRolls]);

  const unknownRolls = useMemo(() => {
    const unknown: string[] = [];
    uniqueParsedRolls.forEach((roll) => {
      if (!normalizedRollMap.has(roll)) unknown.push(roll);
    });
    return unknown;
  }, [normalizedRollMap, uniqueParsedRolls]);

  const presentCount = useMemo(() => {
    if (mode === "present") return matchingStudentIds.size;
    return Math.max(0, students.length - matchingStudentIds.size);
  }, [matchingStudentIds.size, mode, students.length]);

  const absentCount = useMemo(() => {
    if (mode === "absent") return matchingStudentIds.size;
    return Math.max(0, students.length - matchingStudentIds.size);
  }, [matchingStudentIds.size, mode, students.length]);

  const loadBatchStudents = async (batchId: string) => {
    setLoadingStudents(true);
    try {
      const batchStudents: User[] = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await listUsers({ role: "student", batch: batchId, page, limit: 100 });
        totalPages = response.pagination.totalPages;
        batchStudents.push(...response.users);
        page++;
      }

      setStudents(batchStudents);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSave = async () => {
    if (!session || students.length === 0) return;

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const records = students
        .filter((student) => student._id)
        .map((student) => {
          const isListed = matchingStudentIds.has(student._id!);
        const status: AttendanceStatus =
          mode === "present"
            ? isListed
              ? "present"
              : "absent"
            : isListed
              ? "absent"
              : "present";

        return {
          student: student._id!,
          status,
        };
      });

      const result = await createBulkAttendanceRecords({
        session: session._id,
        records,
      });

      const createdCount = result.created.length;
      const errorCount = result.errors.length;
      setSaveMessage(
        errorCount > 0
          ? `Saved ${createdCount} attendance records with ${errorCount} errors.`
          : `Saved ${createdCount} attendance records successfully.`
      );
    } catch (error) {
      console.error("Failed to save attendance:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save attendance records");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
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
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-52 w-full" />
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

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/attendance/session/${sessionId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">CSV</h1>
          <p className="text-muted-foreground">Mark attendance with comma-separated roll numbers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{session.subject.name}</CardTitle>
          <CardDescription>{session.batch.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              {format(new Date(session.start_time), "MMM dd, yyyy")}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              {format(new Date(session.start_time), "hh:mm a")} - {format(new Date(session.end_time), "hh:mm a")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <CardTitle>Comma-Separated Roll Number Method</CardTitle>
          </div>
          <CardDescription>
            Choose whether the entered roll numbers are present or absent, then save attendance for the full class.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "present" ? "default" : "outline"}
              onClick={() => {
                setMode("present");
                setSaveError(null);
                setSaveMessage(null);
              }}
            >
              Entered roll numbers are Present
            </Button>
            <Button
              type="button"
              variant={mode === "absent" ? "default" : "outline"}
              onClick={() => {
                setMode("absent");
                setSaveError(null);
                setSaveMessage(null);
              }}
            >
              Entered roll numbers are Absent
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Roll numbers (comma or new line separated)</p>
            <Textarea
              placeholder="e.g. 22CS001, 22CS003, 22CS010"
              value={rollInput}
              onChange={(e) => {
                setRollInput(e.target.value);
                setSaveError(null);
                setSaveMessage(null);
              }}
              className="min-h-28"
            />
          </div>

          {loadingStudents ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Class Strength</p>
                <p className="text-2xl font-semibold">{students.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-2xl font-semibold text-green-600">{presentCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-2xl font-semibold text-red-500">{absentCount}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">Matched: {matchingStudentIds.size}</Badge>
            <Badge variant={unknownRolls.length > 0 ? "destructive" : "secondary"}>
              Unknown: {unknownRolls.length}
            </Badge>
          </div>

          {unknownRolls.length > 0 && (
            <Alert>
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Unknown roll numbers found</AlertTitle>
              <AlertDescription>
                {unknownRolls.slice(0, 10).join(", ")}
                {unknownRolls.length > 10 ? ` +${unknownRolls.length - 10} more` : ""}
              </AlertDescription>
            </Alert>
          )}

          {saveMessage && (
            <Alert className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Attendance Saved</AlertTitle>
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          )}

          {saveError && (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Save failed</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={saving || loadingStudents || students.length === 0}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
            <Button variant="ghost" onClick={() => router.push(`/dashboard/attendance/session/${sessionId}/swipe`)}>
              Use Swipe Method Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
