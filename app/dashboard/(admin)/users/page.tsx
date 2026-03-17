"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, Pencil, Trash2, Search, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { AddUserDialog } from "./add-user-dialog";

const ITEMS_PER_PAGE = 10;

type TabValue = 'student' | 'parent' | 'staff';

const ROLE_TABS: { value: TabValue; label: string; roles: UserRole[] }[] = [
  { value: 'student', label: 'Students', roles: ['student'] },
  { value: 'parent', label: 'Parents', roles: ['parent'] },
  { value: 'staff', label: 'Staffs', roles: ['teacher', 'admin', 'hod', 'principal', 'staff'] },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all fetched users for staff tab
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // Active search term used for fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<TabValue>('student');
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Fetch users when role, page, or active search changes
  useEffect(() => {
    fetchUsers();
  }, [selectedTab, currentPage, activeSearch]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentTabConfig = ROLE_TABS.find(tab => tab.value === selectedTab);
      if (!currentTabConfig) return;

      // For staff tab, fetch all staff roles and combine
      if (selectedTab === 'staff') {
        const staffRoles = currentTabConfig.roles;
        const allStaffUsers: User[] = [];
        
        // Fetch users for each staff role
        for (const role of staffRoles) {
          try {
            const data = await listUsers({
              role,
              page: 1,
              limit: 100, // Fetch more to combine
              search: activeSearch || undefined,
            });
            allStaffUsers.push(...data.users);
          } catch (err) {
            console.error(`Failed to fetch ${role}s:`, err);
          }
        }
        
        // Client-side pagination for combined staff results
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedUsers = allStaffUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        setAllUsers(allStaffUsers);
        setPagination({
          currentPage,
          totalPages: Math.ceil(allStaffUsers.length / ITEMS_PER_PAGE),
          totalUsers: allStaffUsers.length,
          limit: ITEMS_PER_PAGE,
          hasNextPage: endIndex < allStaffUsers.length,
          hasPreviousPage: currentPage > 1,
        });
      } else {
        // For student and parent, use single role fetch
        const data = await listUsers({
          role: currentTabConfig.roles[0],
          page: currentPage,
          limit: ITEMS_PER_PAGE,
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
  }, [selectedTab, currentPage, activeSearch]);

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserById(userId);
      // Refresh users list
      await fetchUsers();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleUpdateSuccess = () => {
    fetchUsers();
    // UserDialog will handle closing or switching mode, 
    // but if we want to close it:
    // setUserDialogOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as TabValue);
    setCurrentPage(1); // Reset to first page when changing tab
    setSearchQuery(""); // Clear search when changing tab
    setActiveSearch(""); // Clear active search
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      principal: "destructive",
      hod: "secondary",
      teacher: "secondary",
      student: "default",
      parent: "outline",
      staff: "outline",
    };
    return variants[role] || "default";
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="mb-10">
              <CardTitle className="text-3xl font-bold tracking-tight">User Management</CardTitle>
              <CardDescription>
                View, edit, and manage all users in the system
              </CardDescription>
            </div>
            <Button className="w-full md:w-auto cursor-pointer" onClick={() => setAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, first name, or last name... (Press Enter to search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {selectedTab === 'student' ? 'Admission No.' : 
                     selectedTab === 'staff' ? 'Designation' :
                     selectedTab === 'parent' ? 'Relation' : 'Info'}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {selectedTab === 'student' || selectedTab === 'staff' ? 'Department' : 'Phone'}
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No {ROLE_TABS.find(t => t.value === selectedTab)?.label.toLowerCase()} found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{user.user.name}</span>
                          {user.adm_number && (
                            <span className="text-xs text-muted-foreground md:hidden">
                              {user.adm_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-50 truncate">{user.user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getRoleBadgeVariant(user.user.role)}>
                          {user.user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {selectedTab === 'student' && user.adm_number}
                        {selectedTab === 'staff' && user.designation}
                        {selectedTab === 'parent' && user.relation}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.department || user.user.phone || "-"}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} total users)
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Show current page and 2 pages before and after
                    let page;
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
          )}
        </CardContent>

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
            onConfirm={() => handleDelete(selectedUser.user._id)}
          />
        </>
      )}

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
