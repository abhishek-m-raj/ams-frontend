"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { User } from "@/lib/types/UserTypes";

/* Helper to keep Label + Input spacing consistent */
function FormField({
  label,
  children,
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {typeof label === "string" ? <Label>{label}</Label> : label}
      {children}
    </div>
  );
}

export default function ProfileForm({
  initialUser,
}: {
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [editing, setEditing] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const onProfileChange = (k: string, v: unknown) => {
    setUser((s) => s ? ({ ...s, profile: { ...(s.profile ?? {}), [k]: v } }) : s);
  };

  const onChange = <K extends keyof User>(k: K, v: User[K]) => {
    setUser((s) => (s ? ({ ...s, [k]: v }) : s));
  };

  const onSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    // TODO: call API (auth client / backend) to persist changes
    setEditing(false);
    setSavedMsg("Profile updated successfully.");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // If a page accidentally passes null/undefined, show safe message:
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600">No profile available to edit.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {savedMsg && (
        <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-900">
          {savedMsg}
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Account details</h2>
          <p className="text-sm text-muted-foreground">View or update your profile information.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setEditing((v) => !v)}
            variant={editing ? "outline" : "default"}
            className="h-10"
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <FormField label="First Name">
            <Input value={user.first_name ?? ""} disabled />
          </FormField>

          <FormField label="Last Name">
            <Input value={user.last_name ?? ""} disabled />
          </FormField>

          <FormField label="Phone Number">
            <Input
              value={user.phone ? String(user.phone) : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                onChange("phone", digits ? Number(digits) : undefined);
              }}
              disabled={!editing}
              placeholder="+91 9xxxxxxxxx"
            />
          </FormField>

          <FormField label="Gender">
            <div className="relative">
              <select
                aria-label="Gender"
                value={user.gender ?? ""}
                onChange={(e) => onChange("gender", (e.target.value || undefined) as User["gender"])}
                disabled={!editing}
                className={[
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
                  "py-0 appearance-none leading-5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </FormField>
        </div>

        {/* role-specific fields */}
        <div className="mt-6">
          {user.role === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <FormField label="Admission Number">
                <Input value={(user.profile as any)?.adm_number || ""} onChange={(e) => onProfileChange("adm_number", e.target.value)} disabled={!editing} />
              </FormField>

              <FormField label="Admission Year">
                <Input
                  value={(user.profile as any)?.adm_year ? String((user.profile as any).adm_year) : ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    onProfileChange("adm_year", value ? Number(value) : undefined);
                  }}
                  disabled={!editing}
                />
              </FormField>

              <FormField label="Candidate Code">
                <Input value={(user.profile as any)?.candidate_code || ""} onChange={(e) => onProfileChange("candidate_code", e.target.value)} disabled={!editing} />
              </FormField>

              <FormField label="Department">
                <Input value={(user.profile as any)?.department || ""} onChange={(e) => onProfileChange("department", e.target.value || undefined)} disabled={!editing} />
              </FormField>

              <FormField label="Date of Birth">
                <Input type="date" value={(user.profile as any)?.date_of_birth || ""} onChange={(e) => onProfileChange("date_of_birth", e.target.value)} disabled={!editing} />
              </FormField>
            </div>
          )}

          {user.role === "parent" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField label="Relation">
                <Input value={(user.profile as any)?.relation || ""} onChange={(e) => onProfileChange("relation", e.target.value || undefined)} disabled={!editing} placeholder="Father / Mother / Guardian" />
              </FormField>
            </div>
          )}

          {(user.role != "student" && user.role != "parent") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField label="Designation">
                <Input value={(user.profile as any)?.designation || ""} onChange={(e) => onProfileChange("designation", e.target.value)} disabled={!editing} />
              </FormField>

              <FormField label="Department">
                <Input value={(user.profile as any)?.department || ""} onChange={(e) => onProfileChange("department", e.target.value || undefined)} disabled={!editing} />
              </FormField>

              <FormField label="Date of Joining">
                <Input type="date" value={(user.profile as any)?.date_of_joining || ""} onChange={(e) => onProfileChange("date_of_joining", e.target.value)} disabled={!editing} />
              </FormField>
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={!editing}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
