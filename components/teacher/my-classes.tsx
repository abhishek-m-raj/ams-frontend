"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Calendar, Clock } from "lucide-react";
import { getRecentUniqueSessions, type UniqueSession } from "@/lib/api/attendance-session";
import { format } from "date-fns";
import QuickStartDialog from "./quick-start-dialog";

interface MyClassesProps {
  onSessionCreated?: () => void;
}

export default function MyClasses({ onSessionCreated }: MyClassesProps) {
  const [classes, setClasses] = useState<UniqueSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<UniqueSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await getRecentUniqueSessions();
      setClasses(data);
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem: UniqueSession) => {
    setSelectedClass(classItem);
    setDialogOpen(true);
  };

  const handleSessionCreated = () => {
    loadClasses();
    onSessionCreated?.();
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">My Classes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click on a class to start a new session
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No classes found</h3>
              <p className="text-sm text-muted-foreground text-center">
                You haven&apos;t created any attendance sessions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => {
              const key = `${classItem.batch._id}-${classItem.subject._id}`;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary"
                  onClick={() => handleClassClick(classItem)}
                >
                  <CardContent className="space-y-3">
                    {/* Subject */}
                    <div className="flex gap-2">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <h3 className="font-semibold min-w-0 text-base leading-tight truncate">
                          {classItem.subject.name}
                        </h3>
                      <p className="text-xs flex items-center justify-center text-muted-foreground">
                          ({classItem.subject.subject_code})
                        </p>
                    </div>

                    {/* Batch */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">
                        {classItem.batch.name}
                      </span>
                      <Badge variant="outline" className="ml-auto shrink-0">
                        S{classItem.subject.sem}
                      </Badge>
                    </div>

                    {/* Last Session Info */}
                    <div className="flex flex-row items-center gap-4 pt-2 border-t justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last: {format(new Date(classItem.latestSession), "MMM dd, hh:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {classItem.sessionCount} {classItem.sessionCount === 1 ? "session" : "sessions"} conducted
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <QuickStartDialog
        session={selectedClass}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSessionCreated={handleSessionCreated}
      />
    </>
  );
}
