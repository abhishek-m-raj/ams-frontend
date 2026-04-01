"use client";

import { User } from "@/lib/types/UserTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteUserDialog({ user, open, onOpenChange, onConfirm }: DeleteUserDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <span className="font-semibold">{user.name}</span> ({user.email}).
            </p>
            <p className="text-destructive font-medium">
              All associated data including:
            </p>
            <ul className="list-disc list-inside ml-4 text-sm">
              <li>User authentication credentials</li>
              <li>Profile information</li>
              <li>Role-specific data ({user.role})</li>
              {user.role === 'student' && <li>Associated parent records</li>}
            </ul>
            <p className="text-destructive font-medium">
              will be permanently deleted from the system.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
