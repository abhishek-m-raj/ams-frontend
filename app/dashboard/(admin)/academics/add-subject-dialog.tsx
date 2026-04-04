"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSubject } from "@/lib/api/subject";
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
import { Loader2, CheckCircle2, Plus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  sem: z.string().min(1, "Semester is required"),
  subject_code: z.string().min(1, "Subject code is required"),
  type: z.enum(["Theory", "Practical"] as const),
  total_marks: z.number().min(0, "Total marks must be at least 0"),
  pass_mark: z.number().min(0, "Pass mark must be at least 0"),
  faculty_in_charge: z.array(z.object({ name: z.string() })).optional(),
}).refine((data) => data.pass_mark <= data.total_marks, {
  message: "Pass mark cannot be greater than total marks",
  path: ["pass_mark"],
});

type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSubjectDialog({ open, onOpenChange, onSuccess }: AddSubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      sem: "",
      subject_code: "",
      type: "Theory",
      total_marks: 100,
      pass_mark: 40,
      faculty_in_charge: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "faculty_in_charge",
  });

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateSubjectFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const faculty = data.faculty_in_charge?.map(f => f.name).filter(name => name.trim() !== "") || [];
      const payload = {
        ...data,
        faculty_in_charge: faculty.length > 0 ? faculty : undefined,
      };

      await createSubject(payload);
      
      setSuccessMessage("Subject created successfully!");
      
      setTimeout(() => {
        form.reset();
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Create a new course subject with faculty assignments.
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
                  <FormLabel>Subject Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Data Structures" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester *</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Theory">Theory</SelectItem>
                      <SelectItem value="Practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pass_mark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass Mark *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="40" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Faculty In Charge (Optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "" })}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Faculty
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`faculty_in_charge.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Dr. John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

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
                Create Subject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
