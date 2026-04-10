"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { updateUserById } from "@/lib/api/user";
import { User, UpdateUserData } from "@/lib/types/UserTypes";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Form Schema ──────────────────────────────────────────────────────────────

const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name:  z.string().min(1, "Last name is required"),
  phone:      z.number().optional(),
  gender:     z.enum(["male", "female", "other"] as const).optional(),

  // Student profile fields
  adm_number:     z.string().optional(),
  adm_year:       z.number().optional(),
  candidate_code: z.string().optional(),
  department:     z.enum(["CSE", "ECE", "IT"] as const).optional(),
  date_of_birth:  z.string().optional(),

  // Staff profile fields
  designation:    z.string().optional(),
  date_of_joining:z.string().optional(),

  // Parent profile fields
  relation: z.enum(["mother", "father", "guardian"] as const).optional(),
  childID:  z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialMode?: "view" | "edit";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  initialMode = "view",
}: UserDialogProps) {
  const [isEditing, setIsEditing] = useState(initialMode === "edit");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(initialMode === "edit");
  }, [initialMode, open]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name:     "",
      last_name:      "",
      phone:          undefined,
      gender:         undefined,
      adm_number:     "",
      adm_year:       undefined,
      candidate_code: "",
      department:     undefined,
      date_of_birth:  "",
      designation:    "",
      date_of_joining:"",
      relation:       undefined,
      childID:        "",
    },
  });

  // Populate form from user.profile when dialog opens or mode switches
  useEffect(() => {
    if (user && open) {
      const p = (user.profile ?? {}) as any;
      form.reset({
        first_name: user.first_name ?? "",
        last_name:  user.last_name  ?? "",
        phone:      user.phone,
        gender:     user.gender,

        // Student fields (from profile)
        adm_number:     p.adm_number     ?? "",
        adm_year:       p.adm_year,
        candidate_code: p.candidate_code ?? "",
        department:     p.department,
        date_of_birth:  p.date_of_birth
          ? new Date(p.date_of_birth).toISOString().split("T")[0]
          : "",

        // Staff fields (from profile)
        designation:     p.designation    ?? "",
        date_of_joining: p.date_of_joining
          ? new Date(p.date_of_joining).toISOString().split("T")[0]
          : "",

        // Parent fields (from profile)
        relation: p.relation,
        childID:  p.child?._id ?? "",
      });
    }
  }, [user, open, isEditing, form]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const updateData: UpdateUserData = {
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone,
        gender:     data.gender,
      };

      const role = user.role;

      // Build profile sub-object based on role
      const profile: UpdateUserData["profile"] = {};

      if (role === "student") {
        profile.adm_number     = data.adm_number;
        profile.adm_year       = data.adm_year;
        profile.candidate_code = data.candidate_code;
        profile.department     = data.department;
        profile.date_of_birth  = data.date_of_birth || undefined;
      } else if (["teacher", "hod", "principal", "staff", "admin"].includes(role)) {
        profile.designation     = data.designation;
        profile.department      = data.department;
        profile.date_of_joining = data.date_of_joining || undefined;
      } else if (role === "parent") {
        profile.relation = data.relation;
        profile.childID  = data.childID;
      }

      if (Object.keys(profile).length > 0) {
        updateData.profile = profile;
      }

      await updateUserById(user._id, updateData);
      if (onSuccess) onSuccess();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return "Invalid date";
    }
  };

  const role = user.role;
  const isStudent = role === "student";
  const isParent  = role === "parent";
  const isStaff   = ["teacher", "hod", "principal", "staff"].includes(role);

  // Read from profile for completeness checks
  const p = (user.profile ?? {}) as any;
  const hasBasicProfile   = Boolean(user.first_name && user.last_name);
  const hasStudentProfile = !isStudent ? true : Boolean(p.batch && p.adm_number && p.adm_year && p.department && p.date_of_birth);
  const hasStaffProfile   = !isStaff   ? true : Boolean(p.designation && p.department && p.date_of_joining);
  const hasParentProfile  = !isParent  ? true : Boolean(p.relation && p.child?._id);
  const isProfileIncomplete = !(hasBasicProfile && hasStudentProfile && hasStaffProfile && hasParentProfile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-none sm:max-w-none",
          "w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]",
          "rounded-2xl p-6 overflow-hidden flex flex-col",
          "[&>button]:hidden"
        )}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-1 overflow-hidden">

              {/* ── Left Column: Avatar & Quick Info ── */}
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                <div className="relative flex flex-col items-center text-center p-6 border rounded-lg bg-muted/30">

                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-semibold mb-1">{user.name}</h3>
                  <div
                    className="group relative flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 round transition-colors"
                    onClick={() => navigator.clipboard.writeText(user.email)}
                    title="Click to copy email"
                  >
                    <p className="text-muted-foreground break-all text-sm">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="mt-3 text-md px-4 py-1 capitalize">
                    {user.role}
                  </Badge>
                  {isProfileIncomplete && (
                    <Badge variant="secondary" className="mt-2">
                      Profile Incomplete
                    </Badge>
                  )}
                </div>

                {/* Account Meta */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
                    Account Meta
                  </h4>
                  <div className="space-y-2 text-sm">
                    <InfoItem label="User ID"    value={user._id} />
                    <InfoItem label="Created At" value={formatDate(user.createdAt)} />
                    <InfoItem label="Updated At" value={formatDate(user.updatedAt)} />
                  </div>
                </div>

                {/* Edit Button */}
                {!isEditing && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit User
                  </Button>
                )}
              </div>

              {/* ── Right Column: Details / Edit Form ── */}
              <div className="space-y-6 overflow-y-auto pr-2 pb-4">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                    Basic Information
                  </h4>
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      <InfoItem label="First Name"     value={user.first_name} />
                      <InfoItem label="Last Name"      value={user.last_name} />
                      <InfoItem label="Email"          value={user.email} />
                      <InfoItem label="Phone"          value={user.phone?.toString()} />
                      <InfoItem label="Gender"         value={user.gender} />
                      <InfoItem label="Email Verified" value={user.emailVerified ? "Yes" : "No"} />
                    </div>
                  )}
                </div>

                {/* Role-specific section */}
                {(isStudent || isStaff || isParent) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                      {isStudent ? "Academic Information" : isStaff ? "Staff Information" : "Parent Information"}
                    </h4>

                    {/* Student */}
                    {isStudent && (
                      isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="adm_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Admission Number</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="adm_year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Admission Year</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="candidate_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Candidate Code</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
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
                          <FormField
                            control={form.control}
                            name="date_of_birth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          <InfoItem label="Admission No."   value={p.adm_number} />
                          <InfoItem label="Admission Year"  value={p.adm_year?.toString()} />
                          <InfoItem label="Candidate Code"  value={p.candidate_code} />
                          <InfoItem label="Department"      value={p.department} />
                          <InfoItem label="Date of Birth"   value={formatDate(p.date_of_birth)} />
                          {p.batch && (
                            <>
                              <InfoItem
                                label="Batch"
                                value={typeof p.batch === "string" ? p.batch : p.batch?.name}
                              />
                              <InfoItem
                                label="Batch Year"
                                value={
                                  typeof p.batch === "string"
                                    ? undefined
                                    : p.batch?.adm_year?.toString()
                                }
                              />
                            </>
                          )}
                        </div>
                      )
                    )}

                    {/* Staff */}
                    {isStaff && (
                      isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="designation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Designation</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
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
                          <FormField
                            control={form.control}
                            name="date_of_joining"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Joining</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          <InfoItem label="Designation"   value={p.designation} />
                          <InfoItem label="Department"    value={p.department} />
                          <InfoItem label="Date of Joining" value={formatDate(p.date_of_joining)} />
                        </div>
                      )
                    )}

                    {/* Parent */}
                    {isParent && (
                      isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="relation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select relation" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mother">Mother</SelectItem>
                                    <SelectItem value="father">Father</SelectItem>
                                    <SelectItem value="guardian">Guardian</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="childID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Child User ID</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter child user _id" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          <InfoItem label="Relation"   value={p.relation} />
                          {p.child && (
                            <>
                              <InfoItem
                                label="Child Name"
                                value={
                                  p.child?.first_name
                                    ? `${p.child.first_name} ${p.child.last_name}`
                                    : undefined
                                }
                              />
                              <InfoItem label="Child Email" value={p.child?.email} />
                            </>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 pt-4 border-t flex items-center justify-end gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value || value === "N/A") return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      className={cn(
        "space-y-1 px-3 py-2 rounded-md transition-colors group relative select-none",
        value && value !== "N/A"
          ? "cursor-pointer hover:bg-muted/50 active:bg-muted"
          : "cursor-default"
      )}
      title={value && value !== "N/A" ? "Click to copy" : undefined}
    >
      <div className="flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>{label}</span>
        {value && value !== "N/A" && (
          <span
            className={cn(
              "transition-opacity duration-200",
              copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        )}
      </div>
      <p className="text-sm font-medium break-all">{value || "N/A"}</p>
    </div>
  );
}
