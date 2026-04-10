"use client";

import { useState, useEffect, useCallback } from "react";
import { Batch, listBatches, PaginationInfo } from "@/lib/api/batch";
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
import { AddBatchDialog } from "./add-batch-dialog";
import { BatchDialog } from "./batch-dialog";
import { DeleteBatchDialog } from "./delete-batch-dialog";

const ITEMS_PER_PAGE = 10;

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addBatchDialogOpen, setAddBatchDialogOpen] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await listBatches({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      
      setBatches(data.batches);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch batches");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleView = (batch: Batch) => {
    setSelectedBatch(batch);
    setDialogMode("view");
    setBatchDialogOpen(true);
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setDialogMode("edit");
    setBatchDialogOpen(true);
  };

  const handleDelete = (batch: Batch) => {
    setSelectedBatch(batch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = async () => {
    await fetchBatches();
    setSelectedBatch(null);
  };

  const handleAddSuccess = async () => {
    setCurrentPage(1);
    await fetchBatches();
  };

  const handleUpdateSuccess = async () => {
    await fetchBatches();
  };

  const getDepartmentBadgeColor = (department: string) => {
    switch (department) {
      case "CSE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ECE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "";
    }
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

  const filteredBatches = batches.filter((batch) => {
    const query = searchQuery.toLowerCase();
    const advisor = batch.staff_advisor;
    return (
      batch?.name.toLowerCase().includes(query) ||
      batch.department.toLowerCase().includes(query) ||
      batch.adm_year.toString().includes(query) ||
      advisor?.first_name?.toLowerCase().includes(query) ||
      advisor?.last_name?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Batch Management</CardTitle>
              <CardDescription>Manage student batches and their staff advisors</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search batches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full md:w-62.5"
                />
              </div>
              <Button onClick={() => setAddBatchDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Batch
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
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No batches found matching your search" : "No batches available"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Staff Advisor</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch._id}>
                        <TableCell className="font-medium">{batch.name}</TableCell>
                        <TableCell>{batch.adm_year}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getDepartmentBadgeColor(batch.department)}>
                            {batch.department}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {batch.staff_advisor ? (
                            <div>
                              <div className="font-medium">
                                {batch.staff_advisor.first_name} {batch.staff_advisor.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{batch.staff_advisor.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No advisor</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(batch)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(batch)}
                              title="Edit batch"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(batch)}
                              title="Delete batch"
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
      <AddBatchDialog
        open={addBatchDialogOpen}
        onOpenChange={setAddBatchDialogOpen}
        onSuccess={handleAddSuccess}
      />

      <BatchDialog
        batch={selectedBatch}
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        mode={dialogMode}
        onSuccess={handleUpdateSuccess}
      />

      <DeleteBatchDialog
        batch={selectedBatch}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
