"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Batch, updateBatchById } from "@/lib/api/batch";
import { listUsers } from "@/lib/api/user";
import type { User } from "@/lib/types/UserTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  CheckCircle2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Building2,
  User2,
  Search,
  Pencil,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Validation ───────────────────────────────────────────────────────────────

const batchIdRegex = /^[0-9]{2}(CSE|ECE|IT)$/;

const updateBatchSchema = z.object({
  id: z
    .string()
    .regex(batchIdRegex, "Batch ID must match format like 24CSE")
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, "Batch name is required"),
  adm_year: z.number().min(2000).max(2100),
  department: z.enum(["CSE", "ECE", "IT"] as const),
  staff_advisor: z.string().min(1, "Staff advisor is required"),
});

type UpdateBatchFormValues = z.infer<typeof updateBatchSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface BatchDialogProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit";
  onSuccess?: () => void;
}

// ─── Department colours ───────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ECE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  IT:  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BatchDialog({
  batch,
  open,
  onOpenChange,
  mode,
  onSuccess,
}: BatchDialogProps) {
  const [isEditing, setIsEditing]           = useState(mode === "edit");
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit mode — staff list
  const [teacherList, setTeacherList]         = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // View mode — enrolled students
  const [students, setStudents]               = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch]     = useState("");

  // Sync mode when prop changes
  useEffect(() => {
    setIsEditing(mode === "edit");
  }, [mode, open]);

  // ── Form ────────────────────────────────────────────────────────────────────

  const form = useForm<UpdateBatchFormValues>({
    resolver: zodResolver(updateBatchSchema),
    defaultValues: {
      id:            "",
      name:          "",
      adm_year:      new Date().getFullYear(),
      department:    "CSE",
      staff_advisor: "",
    },
  });

  const watchedDepartment = form.watch("department");
  const watchedAdmYear    = form.watch("adm_year");
  const watchedId         = form.watch("id");

  // Auto-generate batch ID from year + dept
  useEffect(() => {
    if (!open || !isEditing) return;
    const idState = form.getFieldState("id");
    if (idState.isDirty) return;
    if (!watchedDepartment || !watchedAdmYear) return;
    const yy      = String(watchedAdmYear).slice(-2).padStart(2, "0");
    const computed = `${yy}${watchedDepartment}`;
    if ((watchedId ?? "").trim().length > 0) return;
    form.setValue("id", computed, { shouldValidate: true, shouldDirty: false });
  }, [open, isEditing, watchedAdmYear, watchedDepartment, watchedId, form]);

  // ── Fetch helpers ───────────────────────────────────────────────────────────

  const fetchTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true);
      const roles: ("teacher" | "hod" | "principal" | "staff")[] = [
        "teacher", "hod", "principal", "staff",
      ];
      const all: User[] = [];
      for (const r of roles) {
        try {
          const d = await listUsers({ role: r, limit: 100 });
          all.push(...d.users);
        } catch { /* silent */ }
      }
      setTeacherList(all);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const fetchStudents = useCallback(async (batchId: string) => {
    try {
      setLoadingStudents(true);
      const all: User[] = [];
      let page = 1, totalPages = 1;
      while (page <= totalPages) {
        const res = await listUsers({ role: "student", batch: batchId, page, limit: 100 });
        totalPages = res.pagination.totalPages;
        all.push(...res.users);
        page++;
      }
      setStudents(all);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // ── On open ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open || !batch) return;

    form.reset({
      id:            batch.id ?? "",
      name:          batch.name,
      adm_year:      batch.adm_year,
      department:    batch.department,
      staff_advisor: batch.staff_advisor?._id || "",
    });

    setError(null);
    setSuccessMessage(null);
    setStudentSearch("");

    if (isEditing) {
      fetchTeachers();
    } else {
      fetchStudents(batch._id);
    }
  }, [open, batch, isEditing, form, fetchTeachers, fetchStudents]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: UpdateBatchFormValues) => {
    if (!batch) return;
    try {
      setIsLoading(true);
      setError(null);
      await updateBatchById(batch._id, data);
      setSuccessMessage("Batch updated successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update batch");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filteredStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    const p = (s.profile ?? {}) as any;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (p.adm_number     ?? "").toLowerCase().includes(q) ||
      (p.candidate_code ?? "").toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (!batch) return null;

  const advisor = batch.staff_advisor;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        w-[calc(100vw-2rem)] / h-[calc(100vh-2rem)]  → 1 rem margin all sides
        rounded-2xl                                   → rounded corners
        [&>button]:hidden                             → hide the default X close button
      */}
      <DialogContent
        className={cn(
          "max-w-none sm:max-w-none",
          "w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]",
          "rounded-2xl p-0 overflow-hidden flex flex-col gap-0",
          "[&>button]:hidden", // hide shadcn's built-in X button
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 border-b px-6 py-4 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold leading-none">
              {isEditing ? "Edit Batch" : batch.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              {isEditing
                ? "Update batch details"
                : `${batch.department} · Admission Year ${batch.adm_year}${batch.id ? ` · ID: ${batch.id}` : ""}`}
            </DialogDescription>
          </div>
        </div>

        {/* ── Alerts ── */}
        {(error || successMessage) && (
          <div className="px-6 pt-3 shrink-0">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="ml-2">{successMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden">

          {isEditing ? (
            /* ─── Edit form ─────────────────────────────────────────────── */
            <div className="h-full overflow-y-auto px-6 py-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-lg">

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adm_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Year *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 2000)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CSE">CSE</SelectItem>
                              <SelectItem value="ECE">ECE</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch ID</FormLabel>
                        <FormControl>
                          <Input placeholder="24CSE" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Auto-filled from year + department. Editable.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staff_advisor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Advisor *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingTeachers}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingTeachers ? "Loading…" : "Select advisor"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teacherList.map((t) => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.name}
                                {t.role && (
                                  <span className="ml-1 text-xs text-muted-foreground capitalize">
                                    · {t.role}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

          ) : (
            /* ─── View mode: 2-column ────────────────────────────────────── */
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] h-full overflow-hidden">

              {/* ── Left: batch summary ── */}
              <div className="border-r overflow-y-auto px-6 py-6 space-y-6">

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Users className="h-4 w-4" />}
                    label="Students"
                    value={loadingStudents ? "—" : String(students.length)}
                  />
                  <StatCard
                    icon={<BookOpen className="h-4 w-4" />}
                    label="Department"
                    value={batch.department}
                  />
                  <StatCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Adm. Year"
                    value={String(batch.adm_year)}
                  />
                  <StatCard
                    icon={<Building2 className="h-4 w-4" />}
                    label="Batch ID"
                    value={batch.id ?? "—"}
                  />
                </div>

            

                {/* Staff advisor */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Staff Advisor
                  </p>
                  {advisor ? (
                    <div className="flex items-center gap-3 rounded-xl border p-4 bg-muted/30">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={undefined} alt={advisor.name} />
                        <AvatarFallback className="text-sm">
                          {getInitials(
                            advisor.first_name && advisor.last_name
                              ? `${advisor.first_name} ${advisor.last_name}`
                              : advisor.name ?? "?"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">
                          {advisor.first_name} {advisor.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{advisor.email}</p>
                        {advisor.role && (
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {advisor.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border p-4 text-muted-foreground">
                      <User2 className="h-4 w-4" />
                      <span className="text-sm">No advisor assigned</span>
                    </div>
                  )}
                </div>

                {/* Edit button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsEditing(true);
                    fetchTeachers();
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Batch
                </Button>
              </div>

              {/* ── Right: student roster ── */}
              <div className="flex flex-col overflow-hidden">

                {/* Roster header */}
                <div className="flex items-center justify-between gap-4 border-b px-6 py-4 shrink-0">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Enrolled Students
                      {!loadingStudents && (
                        <Badge variant="secondary" className="ml-1">
                          {students.length}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All students assigned to this batch
                    </p>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search students…"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                  {loadingStudents ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                      <GraduationCap className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">
                        {studentSearch
                          ? "No students match your search"
                          : "No students enrolled in this batch"}
                      </p>
                      {studentSearch && (
                        <button
                          className="mt-1 text-xs text-primary underline underline-offset-2"
                          onClick={() => setStudentSearch("")}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="hidden sm:table-cell">Admission No.</TableHead>
                          <TableHead className="hidden md:table-cell">Candidate Code</TableHead>
                          <TableHead className="hidden lg:table-cell">Dept</TableHead>
                          <TableHead className="hidden lg:table-cell">Adm. Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student, idx) => {
                          const p = (student.profile ?? {}) as any;
                          return (
                            <TableRow key={student._id} className="hover:bg-muted/30">
                              <TableCell className="text-muted-foreground text-sm">
                                {idx + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={student.image} alt={student.name} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(student.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm leading-none">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {student.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm">
                                {p.adm_number ?? (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                {p.candidate_code ?? (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {p.department ? (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs", DEPT_COLORS[p.department])}
                                  >
                                    {p.department}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">
                                {p.adm_year ?? (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-3 shrink-0 flex justify-end">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border p-3 bg-muted/20 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p className={cn("font-semibold text-lg leading-none", valueClass)}>{value}</p>
    </div>
  );
}
