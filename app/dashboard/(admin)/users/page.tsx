"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { listUsers, deleteUserById } from "@/lib/api/user";
import { User, UserRole, PaginationInfo } from "@/lib/types/UserTypes";
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
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, Pencil, Trash2, Search, UserPlus, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { AddUserDialog } from "./add-user-dialog";
import { BulkUploadDialog } from "./bulk-upload-dialog";

const DEFAULT_ITEMS_PER_PAGE = 10;

type TabValue = "student" | "parent" | "staff";
type SortOption = "name-asc" | "name-desc" | "created-desc" | "created-asc";

const ROLE_TABS: { value: TabValue; label: string; roles: UserRole[] }[] = [
  { value: "student", label: "Students", roles: ["student"] },
  { value: "parent",  label: "Parents",  roles: ["parent"]  },
  { value: "staff",   label: "Staffs",   roles: ["teacher", "admin", "hod", "principal", "staff"] },
];

export default function UsersPage() {
  const [users, setUsers]               = useState<User[]>([]);
  const [pagination, setPagination]     = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedTab, setSelectedTab]   = useState<TabValue>("student");
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [sortOption, setSortOption]     = useState<SortOption>("name-asc");

  // Dialog states
  const [selectedUser, setSelectedUser]         = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen]     = useState(false);
  const [dialogMode, setDialogMode]             = useState<"view" | "edit">("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen]     = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentTabConfig = ROLE_TABS.find((tab) => tab.value === selectedTab);
      if (!currentTabConfig) return;

      if (selectedTab === "staff") {
        // Fetch all staff roles and combine
        const allStaffUsers: User[] = [];
        for (const role of currentTabConfig.roles) {
          try {
            const data = await listUsers({ role, page: 1, limit: 100, search: activeSearch || undefined });
            allStaffUsers.push(...data.users);
          } catch (err) {
            console.error(`Failed to fetch ${role}s:`, err);
          }
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex   = startIndex + itemsPerPage;
        setUsers(allStaffUsers.slice(startIndex, endIndex));
        setPagination({
          currentPage,
          totalPages:    Math.ceil(allStaffUsers.length / itemsPerPage),
          totalUsers:    allStaffUsers.length,
          limit:         itemsPerPage,
          hasNextPage:   endIndex < allStaffUsers.length,
          hasPreviousPage: currentPage > 1,
        });
      } else {
        const data = await listUsers({
          role:   currentTabConfig.roles[0],
          page:   currentPage,
          limit:  itemsPerPage,
          search: activeSearch || undefined,
        });
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab, currentPage, activeSearch, itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Sorted users ───────────────────────────────────────────────────────────

  const sortedUsers = useMemo(() => {
    const cloned = [...users];
    switch (sortOption) {
      case "name-desc":
        return cloned.sort((a, b) => b.name.localeCompare(a.name));
      case "created-desc":
        return cloned.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "created-asc":
        return cloned.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case "name-asc":
      default:
        return cloned.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [users, sortOption]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDelete = async (userId: string) => {
    if (!userId) { setError("Invalid user ID"); return; }
    try {
      await deleteUserById(userId);
      await fetchUsers();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleUpdateSuccess = () => fetchUsers();

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as TabValue);
    setCurrentPage(1);
    setSearchQuery("");
    setActiveSearch("");
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setActiveSearch(searchQuery);
      setCurrentPage(1);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const startItem = pagination ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const endItem   = pagination ? Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers) : 0;

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin:     "destructive",
      principal: "destructive",
      hod:       "secondary",
      teacher:   "secondary",
      student:   "default",
      parent:    "outline",
      staff:     "outline",
    };
    return variants[role] || "default";
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {isLoading ? (
        <div className="p-4 md:p-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="mb-10">
              <CardTitle className="text-3xl font-bold tracking-tight">User Management</CardTitle>
              <CardDescription>View, edit, and manage all users in the system</CardDescription>
            </div>
            <div className="flex w-full md:w-auto flex-col md:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full md:w-auto cursor-pointer"
                onClick={() => setBulkUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                className="w-full md:w-auto cursor-pointer"
                onClick={() => setAddUserDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </div>
          </div>

          <CardContent className="space-y-4">
            {/* Role Tabs */}
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {ROLE_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email... (Press Enter to search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-9"
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {selectedTab === "student" ? "Admission No." :
                       selectedTab === "staff"   ? "Designation"   :
                       selectedTab === "parent"  ? "Relation"      : "Info"}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {selectedTab === "student" || selectedTab === "staff" ? "Department" : "Phone"}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No {ROLE_TABS.find((t) => t.value === selectedTab)?.label.toLowerCase()} found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsers.map((user) => {
                      // All role-specific data lives in user.profile
                      const p = (user.profile ?? {}) as any;
                      return (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              {p.adm_number && (
                                <span className="text-xs text-muted-foreground md:hidden">
                                  {p.adm_number}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-50 truncate">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {selectedTab === "student" && p.adm_number}
                            {selectedTab === "staff"   && p.designation}
                            {selectedTab === "parent"  && p.relation}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {p.department || user.phone || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogMode("view");
                                  setUserDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogMode("edit");
                                  setUserDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex flex-col gap-4 md:gap-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {startItem}–{endItem} of {pagination.totalUsers} users
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Sort</span>
                      <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                        <SelectTrigger className="w-45">
                          <SelectValue placeholder="Sort users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="created-desc">Newest first</SelectItem>
                          <SelectItem value="created-asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Items</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                      >
                        <SelectTrigger className="w-27.5">
                          <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="20">20 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let page: number;
                        if (pagination.totalPages <= 5) {
                          page = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          page = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          page = pagination.totalPages - 4 + i;
                        } else {
                          page = pagination.currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                          className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserDialog
            user={selectedUser}
            open={userDialogOpen}
            onOpenChange={setUserDialogOpen}
            initialMode={dialogMode}
            onSuccess={handleUpdateSuccess}
          />
          <DeleteUserDialog
            user={selectedUser}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => handleDelete(selectedUser._id)}
          />
        </>
      )}

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={fetchUsers}
      />

      <BulkUploadDialog
        open={bulkUploadDialogOpen}
        onOpenChange={setBulkUploadDialogOpen}
        onSuccess={fetchUsers}
      />
    </>
  );
}
