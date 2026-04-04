"use client";

import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Assignment = {
  id: string;
  title: string;
  subjectName: string;
  dueDate: Date;
  description?: string;
  status?: "pending" | "submitted" | "overdue";
};

// TODO: Replace with actual API calls
const assignments: Assignment[] = [
  {
    id: "1",
    title: "Binary Search Tree Implementation",
    subjectName: "Data Structures",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    description: "Implement BST with insert, delete, and search operations",
    status: "pending" as const,
  },
  {
    id: "2",
    title: "SQL Query Optimization",
    subjectName: "Database Management",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: "Analyze and optimize given SQL queries",
    status: "pending" as const,
  },
  {
    id: "3",
    title: "Process Scheduling Algorithms",
    subjectName: "Operating Systems",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: "Compare FCFS, SJF, and Round Robin",
    status: "overdue" as const,
  },
];

export default function StudentDashboardPage() {
  useAuth();

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (assignment.status === "submitted") {
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
          Submitted
        </Badge>
      );
    }

    if (dueDate < now) {
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
          Overdue
        </Badge>
      );
    }

    const hoursUntilDue =
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24) {
      return (
        <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
          Due Soon
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
        Pending
      </Badge>
    );
  };

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      <div className="font-semibold text-2xl ">
        Assignments
      </div>
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No assignments at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {assignment.subjectName}
                  </p>
                </div>
                {getStatusBadge(assignment)}
              </div>

              {assignment.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {assignment.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Due{" "}
                    {formatDistanceToNow(new Date(assignment.dueDate), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
