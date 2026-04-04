"use client";

import { useState, useEffect, useCallback } from "react";
import { Subject, listSubjects, PaginationInfo } from "@/lib/api/subject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, Pencil, Trash2, Search, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddSubjectDialog } from "./add-subject-dialog";
import { SubjectDialog } from "./subject-dialog";
import { DeleteSubjectDialog } from "./delete-subject-dialog";

const ITEMS_PER_PAGE = 10;

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await listSubjects({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      
      setSubjects(data.subjects);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subjects");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleView = (subject: Subject) => {
    setSelectedSubject(subject);
    setDialogMode("view");
    setSubjectDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setDialogMode("edit");
    setSubjectDialogOpen(true);
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = async () => {
    await fetchSubjects();
    setSelectedSubject(null);
  };

  const handleAddSuccess = async () => {
    setCurrentPage(1);
    await fetchSubjects();
  };

  const handleUpdateSuccess = async () => {
    await fetchSubjects();
  };

  const getTypeBadgeColor = (type: string) => {
    return type === "Theory" 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < pagination.totalPages && setCurrentPage(currentPage + 1)}
              className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const filteredSubjects = subjects.filter((subject) => {
    const query = searchQuery.toLowerCase();
    return (
      subject._id.toLowerCase().includes(query) ||
      subject.name.toLowerCase().includes(query) ||
      subject.subject_code.toLowerCase().includes(query) ||
      subject.sem.toLowerCase().includes(query) ||
      subject.type.toLowerCase().includes(query) ||
      subject.faculty_in_charge.some(faculty => faculty.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Subject Management</CardTitle>
              <CardDescription>Manage course subjects and faculty assignments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full md:w-62.5"
                />
              </div>
              <Button onClick={() => setAddSubjectDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No subjects found matching your search" : "No subjects available"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subject) => (
                      <TableRow key={subject._id}>
                        <TableCell className="font-medium">{subject.subject_code}</TableCell>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>Sem {subject.sem}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeBadgeColor(subject.type)}>
                            {subject.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Total: {subject.total_marks}</div>
                            <div className="text-muted-foreground">Pass: {subject.pass_mark}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(subject)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(subject)}
                              title="Edit subject"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(subject)}
                              title="Delete subject"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddSubjectDialog
        open={addSubjectDialogOpen}
        onOpenChange={setAddSubjectDialogOpen}
        onSuccess={handleAddSuccess}
      />

      <SubjectDialog
        subject={selectedSubject}
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        mode={dialogMode}
        onSuccess={handleUpdateSuccess}
      />

      <DeleteSubjectDialog
        subject={selectedSubject}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
