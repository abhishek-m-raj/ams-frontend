"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isValid, parse, parseISO } from "date-fns";
import { Loader2, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";

type BulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type BulkResult = {
  success: Array<{ email: string; role?: string; userId?: string; studentCreated?: boolean }>;
  failed: Array<{ email?: string; error?: string }>;
};

type CsvRow = Record<string, string | undefined>;

type PreviewRow = {
  rowNumber: number;
  first_name: string;
  last_name: string;
  role?: UserRole;
  generate_mail: boolean;
  email?: string;
  studentMeta?: {
    candidate_code?: string;
    adm_year?: number;
    department?: Department;
  };
  errors: string[];
  payload?: BulkCreateUserData;
};

const TEMPLATE_HEADERS = [
  "First Name",
  "Last Name",
  "Role",
  "Generate Mails",
  "Email",
  "Password",
  "Adm Number",
  "Adm Year",
  "Candidate Code",
  "Department",
  "Date of Birth",
  "Batch",
] as const;

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number];

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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const CSV_HEADER_MAP: Record<string, string> = {
  "first name": "first_name",
  first_name: "first_name",
  firstname: "first_name",

  "last name": "last_name",
  last_name: "last_name",
  lastname: "last_name",

  role: "role",

  "generate mails": "generate_mail",
  "generate mail": "generate_mail",
  generate_mail: "generate_mail",

  email: "email",

  password: "password",

  "adm number": "adm_number",
  adm_number: "adm_number",

  "adm year": "adm_year",
  adm_year: "adm_year",

  "candidate code": "candidate_code",
  candidate_code: "candidate_code",

  department: "department",

  "date of birth": "date_of_birth",
  date_of_birth: "date_of_birth",

  batch: "batch",
};

function parseGenerateMail(value: string | undefined): boolean {
  return (value || "").trim().toLowerCase() === "true";
}

function toIsoDate(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;

  // Accept already-normalized ISO date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = parseISO(v);
    return isValid(d) ? format(d, "yyyy-MM-dd") : undefined;
  }

  // Try a couple of common non-ISO formats.
  const formats = ["d/M/yyyy", "dd/MM/yyyy", "M/d/yyyy", "MM/dd/yyyy"];
  for (const fmt of formats) {
    const d = parse(v, fmt, new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  // As a last resort, let Date try.
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return format(d, "yyyy-MM-dd");
}

function buildTemplateCsv(role: UserRole): string {
  const exampleRow: Record<TemplateHeader, string> = {
    "First Name": "John",
    "Last Name": "Doe",
    Role: role,
    "Generate Mails": "false",
    Email: "john.doe@example.com",
    Password: "",
    "Adm Number": role === "student" ? "ADM2024001" : "",
    "Adm Year": role === "student" ? "2024" : "",
    "Candidate Code": role === "student" ? "CAND001" : "",
    Department: role === "student" ? "CSE" : "",
    "Date of Birth": role === "student" ? "2005-01-15" : "",
    Batch: role === "student" ? "BATCH_ID_OR_CODE" : "",
  };

  const csv = Papa.unparse({
    fields: [...TEMPLATE_HEADERS],
    data: [[...TEMPLATE_HEADERS].map((h) => exampleRow[h] ?? "")],
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
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultStatusCode, setResultStatusCode] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);

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
    setResultMessage(null);
    setResultStatusCode(null);
    setIsSubmitting(false);
    setIsParsing(false);
    setPreviewRows(null);
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
        transformHeader: (h) => {
          const normalized = normalizeHeader(h);
          return CSV_HEADER_MAP[normalized] ?? normalized;
        },
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

  const buildPreview = (rows: CsvRow[], enforcedRole: UserRole): PreviewRow[] => {
    return rows.map((r, idx) => {
      const rowNumber = idx + 2; // header is row 1

      const first_name = (r.first_name || "").trim();
      const last_name = (r.last_name || "").trim();
      const role = normalizeRole(r.role);
      const generate_mail = parseGenerateMail(r.generate_mail);

      const emailRaw = (r.email || "").trim();
      const password = (r.password || "").trim();

      const adm_number = (r.adm_number || "").trim();
      const adm_year_raw = (r.adm_year || "").trim();
      const candidate_code = (r.candidate_code || "").trim();
      const department = toDepartment(r.department);
      const departmentRaw = (r.department || "").trim();
      const dobRaw = (r.date_of_birth || "").trim();
      const date_of_birth = dobRaw ? toIsoDate(dobRaw) : undefined;
      const batch = (r.batch || "").trim();

      const errors: string[] = [];
      if (!first_name) errors.push("First Name is required");
      if (!last_name) errors.push("Last Name is required");
      if (!role) errors.push("Role is required (student/teacher/parent/principal/hod/staff/admin)");
      if (role && role !== enforcedRole) {
        errors.push(`Mixed roles not allowed (expected ${enforcedRole})`);
      }

      if (!generate_mail) {
        if (!emailRaw) errors.push("Email is required when Generate Mails is false");
      } else {
        if (!candidate_code) errors.push("Candidate Code is required when Generate Mails is true");
        if (!adm_year_raw) errors.push("Adm Year is required when Generate Mails is true");
        if (!departmentRaw) errors.push("Department is required when Generate Mails is true");
      }

      let adm_year: number | undefined;
      if (adm_year_raw) {
        const parsed = Number.parseInt(adm_year_raw, 10);
        if (Number.isNaN(parsed)) {
          errors.push("Adm Year must be a number");
        } else {
          adm_year = parsed;
        }
      }

      if (departmentRaw && !department) {
        errors.push("Department must be one of: CSE, ECE, IT");
      }

      if (dobRaw && !date_of_birth) {
        errors.push("Date of Birth must be a valid date (YYYY-MM-DD preferred)");
      }

      let payload: BulkCreateUserData | undefined;
      if (!errors.length && role) {
        const base: BulkCreateUserData = {
          first_name,
          last_name,
          role,
          generate_mail,
        };

        if (!generate_mail && emailRaw) {
          base.email = emailRaw;
        }
        if (password) base.password = password;
        if (adm_number) base.adm_number = adm_number;
        if (adm_year !== undefined) base.adm_year = adm_year;
        if (candidate_code) base.candidate_code = candidate_code;
        if (department) base.department = department;
        if (date_of_birth) base.date_of_birth = date_of_birth;
        if (batch) base.batch = batch;

        payload = base;
      }

      return {
        rowNumber,
        first_name,
        last_name,
        role,
        generate_mail,
        email: generate_mail ? undefined : emailRaw,
        studentMeta: {
          candidate_code: candidate_code || undefined,
          adm_year,
          department,
        },
        errors,
        payload,
      };
    });
  };

  const handleDownloadTemplate = () => {
    if (!targetRole) {
      setError("Select a target role to download the template.");
      return;
    }

    const csv = buildTemplateCsv(targetRole);
    downloadTextFile(`ams-users-${targetRole}-template.csv`, csv);
  };

  useEffect(() => {
    const run = async () => {
      if (!file || !targetRole) {
        setPreviewRows(null);
        return;
      }

      try {
        setIsParsing(true);
        setError(null);
        setPreviewRows(null);

        const rows = await parseCsvFile(file);
        if (!rows.length) {
          setPreviewRows([]);
          setError("CSV appears to be empty.");
          return;
        }

        const preview = buildPreview(rows, targetRole);
        setPreviewRows(preview);
      } catch (e) {
        setPreviewRows(null);
        setError(e instanceof Error ? e.message : "Failed to parse CSV");
      } finally {
        setIsParsing(false);
      }
    };

    run();
  }, [file, targetRole]);

  const handleSubmit = async () => {
    try {
      setError(null);
      setResult(null);
      setResultMessage(null);
      setResultStatusCode(null);

      if (!targetRole) {
        setError("Select a target role for this import.");
        return;
      }

      if (!file) {
        setError("Choose a CSV file to upload.");
        return;
      }

      if (isParsing) {
        setError("Please wait for CSV parsing to finish.");
        return;
      }

      if (!previewRows) {
        setError("CSV preview is not ready yet.");
        return;
      }

      if (!previewRows.length) {
        setError("CSV appears to be empty.");
        return;
      }

      const rowsWithErrors = previewRows.filter((r) => r.errors.length);
      if (rowsWithErrors.length) {
        setError(
          `Fix validation errors before uploading. ${rowsWithErrors.length} row(s) have issues.`
        );
        return;
      }

      const payload = previewRows
        .map((r) => r.payload)
        .filter((p): p is BulkCreateUserData => Boolean(p));

      if (!payload.length) {
        setError("No valid rows to upload.");
        return;
      }

      setIsSubmitting(true);
      const response = await createUsersBulk(payload);

      setResult({
        success: response.data?.success ?? [],
        failed: response.data?.failed ?? [],
      });
      setResultMessage(response.message || null);
      setResultStatusCode(response.httpStatus ?? response.status_code ?? null);

      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const succeededCount = result?.success?.length ?? 0;
  const failedCount = result?.failed?.length ?? 0;
  const hasFailures = failedCount > 0;
  const isPartial = resultStatusCode === 207;
  const isAllFailed = resultStatusCode === 422;

  const previewErrorCount = previewRows?.filter((r) => r.errors.length).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-full max-h-[85vh] overflow-y-auto">
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
          <Alert
            variant={isAllFailed ? "destructive" : undefined}
            className={
              isPartial
                ? "bg-muted/50"
                : !isAllFailed && hasFailures
                  ? "border-destructive/40 bg-destructive/10"
                  : !isAllFailed
                    ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
                    : undefined
            }
          >
            {isAllFailed || hasFailures ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription className="ml-2 space-y-1">
              {isPartial ? (
                <div className="font-medium">Some users could not be created. See details below.</div>
              ) : null}
              {resultMessage ? <div>{resultMessage}</div> : null}
              <div>
                Completed: {succeededCount} succeeded, {failedCount} failed.
              </div>
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
              Use the template to ensure correct headers.
            </p>
          </div>

          {isParsing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing CSV...
            </div>
          ) : null}

          {previewRows ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Preview</div>
                <div className="text-xs text-muted-foreground">
                  {previewRows.length} row(s), {previewErrorCount} with errors
                </div>
              </div>

              <div className="rounded-md border max-h-64 overflow-y-auto overflow-x-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Mail Generation</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.slice(0, 50).map((r) => (
                      <TableRow key={r.rowNumber}>
                        <TableCell className="text-muted-foreground">{r.rowNumber}</TableCell>
                        <TableCell>{r.first_name || "—"}</TableCell>
                        <TableCell>{r.last_name || "—"}</TableCell>
                        <TableCell>{r.role ?? "—"}</TableCell>
                        <TableCell>
                          {r.generate_mail ? (
                            <Badge variant="secondary">✉ Auto-generate</Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-normal wrap-break-word max-w-[260px]">
                          {r.generate_mail ? "(generated)" : r.email || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {previewRows.length > 50 ? (
                <div className="text-xs text-muted-foreground">Showing first 50 rows.</div>
              ) : null}
            </div>
          ) : null}

          {result ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3 max-h-56 overflow-y-auto overflow-x-hidden">
                <div className="font-medium mb-2">Success</div>
                {result.success?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Student</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.success.slice(0, 50).map((s, idx) => (
                        <TableRow key={`${s.email}-${idx}`}>
                          <TableCell className="whitespace-normal wrap-break-word max-w-[260px]">
                            {s.email}
                          </TableCell>
                          <TableCell>{s.role ?? "—"}</TableCell>
                          <TableCell>
                            {typeof s.studentCreated === "boolean" ? (
                              s.studentCreated ? (
                                <Badge variant="secondary">created</Badge>
                              ) : (
                                <Badge variant="outline">not created</Badge>
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-muted-foreground">No successes.</div>
                )}
                {result.success.length > 50 ? (
                  <div className="text-xs text-muted-foreground mt-2">Showing first 50 successes.</div>
                ) : null}
              </div>

              <div className="rounded-md border p-3 max-h-56 overflow-y-auto overflow-x-hidden">
                <div className="font-medium mb-2">Failed</div>
                {result.failed?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.failed.slice(0, 50).map((f, idx) => (
                        <TableRow key={`${f.email ?? "unknown"}-${idx}`}>
                          <TableCell className="text-destructive whitespace-normal wrap-break-word max-w-[220px]">
                            {f.email || "(no identifier)"}
                          </TableCell>
                          <TableCell className="text-destructive whitespace-normal wrap-break-word max-w-[360px]">
                            {f.error || "Unknown error"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-muted-foreground">No failures.</div>
                )}
                {result.failed.length > 50 ? (
                  <div className="text-xs text-muted-foreground mt-2">Showing first 50 failures.</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || isParsing}>
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
