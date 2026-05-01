"use client";

import Navbar from "@/components/appshell/navbar";
import { useEffect, useMemo } from "react";
import { BellRing, BookOpen, Home, Users, ClipboardCheck } from "lucide-react";
import Dock from '@/components/appshell/Dock';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar as AvatarIcon, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import Loading from "@/app/loading";
import Avatar, { genConfig } from 'react-nice-avatar';

// Routes shared by all roles
const SHARED_ROUTES = [
  "/dashboard/profile",
  "/dashboard/notifications",
  "/dashboard/assignments",
];

export default function DashboardLayout({
  children,
  admin,
  student,
  teacher
}: Readonly<{
  children: React.ReactNode;
  admin: React.ReactNode;
  student: React.ReactNode;
  teacher: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, session, incompleteProfile, config } = useAuth();
  const notificationsEnabled = Boolean(config["feature/notifications"]);
  const isSharedRoute = SHARED_ROUTES.some((r) => pathname.startsWith(r));

  const profileImageConfig: ReturnType<typeof genConfig> = useMemo(() => {
    const gender = user?.gender?.toLowerCase();
    const userGender: "man" | "woman" = gender == "male" || gender === "man" ? "man" : "woman";
    const randomConfig = genConfig(user?.email || "");
    return {
      ...randomConfig,
      sex: userGender,
    };
  }, [user?.email, user?.gender]);

  const dockItems = useMemo(() => {
    const baseItems = [
      { icon: <Home size={18} />, label: 'Home', onClick: () => router.push('/dashboard') },
    ];

    // Admin-specific items
    if (user?.role === 'admin' || user?.role === 'principal') {
      baseItems.push(
        { icon: <Users size={18} />, label: 'Users', onClick: () => router.push('/dashboard/users') },
        { icon: <BookOpen size={18} />, label: 'Academics', onClick: () => router.push('/dashboard/academics') },
      );
    }

    // Student-specific items
    if (user?.role === 'student') {
      baseItems.push(
        { icon: <ClipboardCheck size={18} />, label: 'Attendance', onClick: () => router.push('/dashboard/attendance') }
      );
    }

    // Teacher-specific items
    if (user?.role === 'teacher' || user?.role === 'hod') {
      baseItems.push(
        { icon: <ClipboardCheck size={18} />, label: 'Attendance', onClick: () => router.push('/dashboard/attendance') }
      );
    }

    // Common items for all roles
    if (notificationsEnabled) {
      baseItems.push(
        { icon: <BellRing size={18} />, label: 'Notifications', onClick: () => router.push('/dashboard/notifications') },
      );
    }
    //{ icon: <Book size={18} />, label: 'Assignments', onClick: () => router.push('/dashboard/assignments') },

    // Profile item (always last)
    baseItems.push({
      icon: (
        user?.image != undefined && user?.image != "" && user?.image != "gen" ?
        <AvatarIcon className="h-6 w-6 sm:h-8 sm:w-8">
          <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
          <AvatarFallback className="text-[8px]">{user?.name?.[0] || 'U'}</AvatarFallback>
        </AvatarIcon> :
        <Avatar {...profileImageConfig} className="h-6 w-6 sm:h-8 sm:w-8" />
      ), 
      label: 'Profile', 
      onClick: () => router.push('/dashboard/profile')
    });

    return baseItems;
  }, [router, user, profileImageConfig, notificationsEnabled]);

  useEffect(() => {
    // Still loading, don't do anything yet
    if (isLoading) return;

    // Not authenticated
    if (!session || !user) {
      router.push('/signin');
      return;
    }

    // User needs onboarding - redirect immediately
    if (incompleteProfile) {
      router.push('/onboarding');
      return;
    }
  }, [isLoading, session, user, incompleteProfile, router]);

  if (isLoading) {
    return <Loading />;
  }

  // If user data not ready or needs onboarding, show loader (don't render dashboard)
  if (!user || incompleteProfile) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen w-full" suppressHydrationWarning>
      <Dock 
        items={dockItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        className="mb-6"
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto sm:pb-20">
          {isSharedRoute && !pathname.startsWith("/dashboard/notifications") && children}
          {isSharedRoute && pathname.startsWith("/dashboard/notifications") && notificationsEnabled && children}

          {!isSharedRoute && user.role === "student" && student}
          {!isSharedRoute && user.role === "admin" && admin}
          {!isSharedRoute && (user.role === "teacher" || user.role === "hod") && teacher}
          
          {!isSharedRoute && !["student", "admin", "teacher", "hod"].includes(user.role) && (
            <div className="flex flex-1 items-center justify-center">
              <p>Your role &quot;{user.role}&quot; does not have a dashboard implemented yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
