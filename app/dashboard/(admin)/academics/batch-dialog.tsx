"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Batch, updateBatchById, Department } from "@/lib/api/batch";
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
import { Badge } from "@/components/ui/badge";

const updateBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  adm_year: z.number().min(2000).max(2100),
  department: z.enum(["CSE", "ECE", "IT"] as const),
  staff_advisor: z.string().min(1, "Staff advisor is required"),
});

type UpdateBatchFormValues = z.infer<typeof updateBatchSchema>;

interface BatchDialogProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit";
  onSuccess?: () => void;
}

export function BatchDialog({ batch, open, onOpenChange, mode, onSuccess }: BatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const form = useForm<UpdateBatchFormValues>({
    resolver: zodResolver(updateBatchSchema),
    defaultValues: {
      name: "",
      adm_year: new Date().getFullYear(),
      department: "CSE",
      staff_advisor: "",
    },
  });

  useEffect(() => {
    if (open && batch) {
      form.reset({
        name: batch.name,
        adm_year: batch.adm_year,
        department: batch.department,
        staff_advisor: batch.staff_advisor?._id || "",
      });
      if (mode === "edit") {
        fetchTeachers();
      }
    }
  }, [open, batch, mode]);

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
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: UpdateBatchFormValues) => {
    if (!batch) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      await updateBatchById(batch._id, data);
      
      setSuccessMessage("Batch updated successfully!");
      
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update batch");
    } finally {
      setIsLoading(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "view" ? "Batch Details" : "Edit Batch"}</DialogTitle>
          <DialogDescription>
            {mode === "view" ? "View batch information" : "Update batch details"}
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

        {mode === "view" ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batch Name</p>
              <p className="text-base">{batch.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admission Year</p>
              <p className="text-base">{batch.adm_year}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <Badge variant="outline" className="mt-1">
                {batch.department}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Staff Advisor</p>
              {batch.staff_advisor ? (
                <div className="mt-1">
                  <p className="text-base">
                    {batch.staff_advisor.user.first_name} {batch.staff_advisor.user.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{batch.staff_advisor.user.email}</p>
                </div>
              ) : (
                <p className="text-base text-muted-foreground">No advisor assigned</p>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                        <SelectTrigger>
                          <SelectValue />
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
                          <SelectValue placeholder={loadingTeachers ? "Loading..." : "Select advisor"} />
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
                  Update Batch
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {mode === "view" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
