"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users } from "lucide-react";
import { BatchManagement } from "./batch-management";
import { SubjectManagement } from "./subject-management";

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "subjects">("batches");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Management</h2>
          <p className="text-muted-foreground">
            Manage batches and subjects for the academic system
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "batches" | "subjects")} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="batches" className="gap-2 cursor-pointer">
            <Users className="h-4 w-4" />
            Batches
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2 cursor-pointer">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <BatchManagement />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <SubjectManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
