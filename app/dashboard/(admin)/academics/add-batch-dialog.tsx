"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBatch, Department } from "@/lib/api/batch";
import { listUsers } from "@/lib/api/user";
import type { User } from "@/lib/types/UserTypes";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  adm_year: z.number().min(2000, "Year must be at least 2000").max(2100, "Year must be at most 2100"),
  department: z.enum(["CSE", "ECE", "IT"] as const),
  staff_advisor: z.string().min(1, "Staff advisor is required"),
});

type CreateBatchFormValues = z.infer<typeof createBatchSchema>;

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddBatchDialog({ open, onOpenChange, onSuccess }: AddBatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const form = useForm<CreateBatchFormValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      name: "",
      adm_year: new Date().getFullYear(),
      department: "CSE",
      staff_advisor: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchTeachers();
    }
  }, [open]);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await listUsers({ role: "teacher", limit: 100 });
      setTeachers(data.users);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateBatchFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      await createBatch(data);
      
      setSuccessMessage("Batch created successfully!");
      
      setTimeout(() => {
        form.reset();
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
          <DialogDescription>
            Create a new student batch with a staff advisor.
          </DialogDescription>
        </DialogHeader>

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="CSE 2024 Batch A" {...field} />
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
                  <FormLabel>Admission Year *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                      <SelectItem value="ECE">Electronics & Communication</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingTeachers}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTeachers ? "Loading teachers..." : "Select staff advisor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher._id} value={teacher._id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Create Batch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
