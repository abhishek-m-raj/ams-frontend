"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUsersBulk } from "@/lib/api/user";
import { BulkCreateUserData, Department, UserRole } from "@/lib/types/UserTypes";
import { listBatches, Batch } from "@/lib/api/batch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form schema for creating a new user
const createUserFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["student", "teacher", "parent", "hod", "principal", "staff", "admin"] as const),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  // Student-only
  batch: z.string().optional(),
  adm_number: z.string().optional(),
  adm_year: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().optional()
  ),
  candidate_code: z.string().optional(),
  department: z.enum(["CSE", "ECE", "IT"] as const).optional(),
  date_of_birth: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.role === "student" && !val.batch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Batch is required for students",
      path: ["batch"],
    });
  }
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      password: "",
      batch: "",
      adm_number: "",
      adm_year: undefined,
      candidate_code: "",
      department: undefined,
      date_of_birth: "",
    },
  });

  const selectedRole = form.watch("role");

  useEffect(() => {
    const loadBatches = async () => {
      if (!open) return;
      if (selectedRole !== "student") return;
      try {
        setIsBatchesLoading(true);
        const result = await listBatches({ page: 1, limit: 100 });
        setBatches(result.batches);
      } catch (e) {
        console.error("Failed to load batches", e);
      } finally {
        setIsBatchesLoading(false);
      }
    };
    loadBatches();
  }, [open, selectedRole]);

  const batchOptions = useMemo(
    () => batches.map((b) => ({ value: b._id, label: `${b.name} (${b.adm_year})` })),
    [batches]
  );

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form and clear errors when dialog closes
      form.reset();
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateUserFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload: BulkCreateUserData = {
        name: data.name,
        email: data.email,
        role: data.role,
      };

      if (data.password) {
        payload.password = data.password;
      }

      if (data.role === "student") {
        payload.batch = data.batch;
        if (data.adm_number) payload.adm_number = data.adm_number;
        if (data.adm_year) payload.adm_year = data.adm_year;
        if (data.candidate_code) payload.candidate_code = data.candidate_code;
        if (data.department) payload.department = data.department as Department;
        if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;
      }

      // Use bulk endpoint with single user in array
      const response = await createUsersBulk([payload]);
      
      // Check if the user creation failed
      if (response.data?.failed && response.data.failed.length > 0) {
        setError(response.data.failed[0].error || "Failed to create user");
        return;
      }
      
      // Check if user was successfully created
      if (response.data?.success && response.data.success.length > 0) {
        setSuccessMessage("User created successfully!");
      } else {
        setSuccessMessage(response.data?.failed[0].error || "User created successfully!");
      }
      
      setTimeout(() => {
        form.reset();
        setSuccessMessage(null);
        onOpenChange(false);
        
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will complete their profile during sign-in.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2">{successMessage}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === "student" && (
              <>
                <FormField
                  control={form.control}
                  name="batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isBatchesLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isBatchesLoading ? "Loading batches..." : "Select batch"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batchOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adm_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ADM2024001" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="2024" value={field.value ?? ""} onChange={field.onChange} />
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
                      <FormControl>
                        <Input placeholder="CAND001" {...field} />
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
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
              </>
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Leave blank for auto-generated password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
