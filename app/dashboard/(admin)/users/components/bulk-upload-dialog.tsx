"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { createUsersBulk } from "@/lib/api/user";
import { BulkCreateUserData, Department, UserRole } from "@/lib/types/UserTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";

type BulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type BulkResult = {
  success: Array<{ email: string; role: string; userId: string }>;
  failed: Array<{ email: string; error: string }>;
};

type CsvRow = Record<string, string | undefined>;

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
  { value: "hod", label: "HOD" },
  { value: "principal", label: "Principal" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

function toDepartment(value: string | undefined): Department | undefined {
  const v = (value || "").trim().toUpperCase();
  if (v === "CSE" || v === "ECE" || v === "IT") return v as Department;
  return undefined;
}

function normalizeRole(value: string | undefined): UserRole | undefined {
  const v = (value || "").trim().toLowerCase();
  if (!v) return undefined;
  if (
    v === "student" ||
    v === "teacher" ||
    v === "parent" ||
    v === "principal" ||
    v === "hod" ||
    v === "staff" ||
    v === "admin"
  ) {
    return v as UserRole;
  }
  return undefined;
}

function buildTemplateCsv(role: UserRole): string {
  const baseHeaders = ["name", "email", "role", "password"]; // password optional
  const studentHeaders = [
    "batch",
    "adm_number",
    "adm_year",
    "candidate_code",
    "department",
    "date_of_birth",
  ];

  const headers = role === "student" ? [...baseHeaders, ...studentHeaders] : baseHeaders;

  const exampleRow: Record<string, string> = {
    name: "John Doe",
    email: "john@example.com",
    role,
    password: "",
  };

  if (role === "student") {
    exampleRow.batch = "batch_id_here";
    exampleRow.adm_number = "ADM2024001";
    exampleRow.adm_year = "2024";
    exampleRow.candidate_code = "CAND001";
    exampleRow.department = "CSE";
    exampleRow.date_of_birth = "2005-01-15";
  }

  const csv = Papa.unparse({
    fields: headers,
    data: [headers.map((h) => exampleRow[h] ?? "")],
  });

  return csv + "\n";
}

function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [targetRole, setTargetRole] = useState<UserRole | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDownloadTemplate = Boolean(targetRole);

  const roleLabel = useMemo(
    () => ROLES.find((r) => r.value === targetRole)?.label,
    [targetRole]
  );

  const resetState = () => {
    setTargetRole("");
    setFile(null);
    setError(null);
    setResult(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const parseCsvFile = async (csvFile: File): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<CsvRow>(csvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
        complete: (res) => {
          if (res.errors?.length) {
            reject(new Error(res.errors[0]?.message || "Failed to parse CSV"));
            return;
          }
          resolve(res.data || []);
        },
      });
    });
  };

  const toPayload = (rows: CsvRow[], enforcedRole: UserRole): BulkCreateUserData[] => {
    const roleValuesInFile = rows
      .map((r) => normalizeRole(r.role))
      .filter((r): r is UserRole => Boolean(r));

    const hasMixedRole = roleValuesInFile.some((r) => r !== enforcedRole);
    if (hasMixedRole) {
      throw new Error(
        `CSV contains mixed roles. This upload is restricted to role: ${enforcedRole}.`
      );
    }

    const payload: BulkCreateUserData[] = rows.map((r) => {
      const name = (r.name || "").trim();
      const email = (r.email || "").trim();
      const password = (r.password || "").trim();

      const rowRole = normalizeRole(r.role) || enforcedRole;
      if (rowRole !== enforcedRole) {
        throw new Error(
          `CSV contains mixed roles. This upload is restricted to role: ${enforcedRole}.`
        );
      }

      const base: BulkCreateUserData = {
        name,
        email,
        role: enforcedRole,
        ...(password ? { password } : {}),
      };

      if (enforcedRole === "student") {
        const batch = (r.batch || "").trim();
        if (batch) base.batch = batch;

        const admNumber = (r.adm_number || "").trim();
        if (admNumber) base.adm_number = admNumber;

        const admYear = (r.adm_year || "").trim();
        if (admYear) {
          const parsed = Number(admYear);
          if (!Number.isNaN(parsed)) base.adm_year = parsed;
        }

        const candidateCode = (r.candidate_code || "").trim();
        if (candidateCode) base.candidate_code = candidateCode;

        const department = toDepartment(r.department);
        if (department) base.department = department;

        const dob = (r.date_of_birth || "").trim();
        if (dob) base.date_of_birth = dob;
      }

      return base;
    });

    // Basic validation
    const errors: string[] = [];
    payload.forEach((u, idx) => {
      if (!u.name) errors.push(`Row ${idx + 2}: name is required`);
      if (!u.email) errors.push(`Row ${idx + 2}: email is required`);
      if (enforcedRole === "student" && !u.batch) errors.push(`Row ${idx + 2}: batch is required for students`);
    });

    if (errors.length) throw new Error(errors.slice(0, 5).join("\n"));

    return payload;
  };

  const handleDownloadTemplate = () => {
    if (!targetRole) {
      setError("Select a target role to download the template.");
      return;
    }

    const csv = buildTemplateCsv(targetRole);
    downloadTextFile(`ams-users-${targetRole}-template.csv`, csv);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setResult(null);

      if (!targetRole) {
        setError("Select a target role for this import.");
        return;
      }

      if (!file) {
        setError("Choose a CSV file to upload.");
        return;
      }

      setIsSubmitting(true);

      const rows = await parseCsvFile(file);
      if (!rows.length) {
        throw new Error("CSV appears to be empty.");
      }

      const payload = toPayload(rows, targetRole);
      const response = await createUsersBulk(payload);

      setResult(response.data as BulkResult);

      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Users (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV to create multiple users. One upload can only contain a single role.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2">
              Completed: {result.success?.length ?? 0} succeeded, {result.failed?.length ?? 0} failed.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Target Role *</Label>
            <Select value={targetRole} onValueChange={(v) => setTargetRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={!canDownloadTemplate || isSubmitting}
            >
              <Download className="mr-2 h-4 w-4" />
              Download {roleLabel ?? ""} Template
            </Button>

            <div className="flex-1" />
          </div>

          <div className="space-y-2">
            <Label>CSV File *</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={isSubmitting}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Use the template to ensure correct headers. Student imports must include `batch`.
            </p>
          </div>

          {result?.failed?.length ? (
            <div className="rounded-md border p-3 max-h-40 overflow-auto text-sm">
              <div className="font-medium mb-2">Failed</div>
              <ul className="space-y-1">
                {result.failed.slice(0, 25).map((f) => (
                  <li key={f.email} className="text-destructive">
                    {f.email}: {f.error}
                  </li>
                ))}
              </ul>
              {result.failed.length > 25 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Showing first 25 failures.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
