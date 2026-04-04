"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Subject, updateSubjectById } from "@/lib/api/subject";
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
import { Badge } from "@/components/ui/badge";

const updateSubjectSchema = z.object({
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

type UpdateSubjectFormValues = z.infer<typeof updateSubjectSchema>;

interface SubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "edit";
  onSuccess?: () => void;
}

export function SubjectDialog({ subject, open, onOpenChange, mode, onSuccess }: SubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<UpdateSubjectFormValues>({
    resolver: zodResolver(updateSubjectSchema),
    defaultValues: {
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

  useEffect(() => {
    if (open && subject) {
      form.reset({
        sem: subject.sem,
        subject_code: subject.subject_code,
        type: subject.type,
        total_marks: subject.total_marks,
        pass_mark: subject.pass_mark,
        faculty_in_charge: subject.faculty_in_charge.map(name => ({ name })),
      });
    }
  }, [open, subject, form]);

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: UpdateSubjectFormValues) => {
    if (!subject) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const faculty = data.faculty_in_charge?.map(f => f.name).filter(name => name.trim() !== "") || [];
      const payload = {
        ...data,
        faculty_in_charge: faculty.length > 0 ? faculty : undefined,
      };

      await updateSubjectById(subject._id, payload);
      
      setSuccessMessage("Subject updated successfully!");
      
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subject");
    } finally {
      setIsLoading(false);
    }
  };

  if (!subject) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "view" ? "Subject Details" : "Edit Subject"}</DialogTitle>
          <DialogDescription>
            {mode === "view" ? "View subject information" : "Update subject details"}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subject ID</p>
                <p className="text-base">{subject._id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subject Code</p>
                <p className="text-base">{subject.subject_code}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Subject Name</p>
              <p className="text-base">{subject.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Semester</p>
                <p className="text-base">Sem {subject.sem}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">
                  {subject.type}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Marks</p>
                <p className="text-base">{subject.total_marks}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Mark</p>
                <p className="text-base">{subject.pass_mark}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Faculty In Charge</p>
              {subject.faculty_in_charge.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {subject.faculty_in_charge.map((faculty, idx) => (
                    <li key={idx} className="text-base">{faculty}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-muted-foreground">No faculty assigned</p>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Code *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                          <SelectValue />
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
                  <FormLabel>Faculty In Charge *</FormLabel>
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
                            <Input {...field} />
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
                  Update Subject
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
