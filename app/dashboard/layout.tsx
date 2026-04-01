"use client";

import Navbar from "@/components/appshell/navbar";
import { useEffect, useMemo } from "react";
import { Bell, BellRing, Book, BookOpen, CalendarDays, Home, Settings, Users, ClipboardCheck } from "lucide-react";
import Dock from '@/components/appshell/Dock';
import { useRouter } from 'next/navigation';
import { Avatar as AvatarIcon, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import Loading from "@/app/loading";
import Avatar, { genConfig } from 'react-nice-avatar';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, isLoading, session } = useAuth();

  const profileImageConfig: ReturnType<typeof genConfig> = useMemo(() => {
    const gender = user?.gender?.toLowerCase();
    const userGender: "man" | "woman" = gender == "male" || gender === "man" ? "man" : "woman";
    const randomConfig = genConfig(user?.email || "");
    return {
      ...randomConfig,
      sex: userGender,
    };
  }, [user?.email, user?.gender]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/signin');
    }
  }, [isLoading, session, router]);

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

    // Teacher-specific items
    if (user?.role === 'teacher' || user?.role === 'hod') {
      baseItems.push( 
        { icon: <ClipboardCheck size={18} />, label: 'Attendance', onClick: () => router.push('/dashboard/attendance') }
      );
    }

    // Common items for all roles
    baseItems.push(
      { icon: <BellRing size={18} />, label: 'Notifications', onClick: () => router.push('/dashboard/notifications') },
      //{ icon: <Book size={18} />, label: 'Assignments', onClick: () => router.push('/dashboard/assignments') },
    );

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
  }, [router, user, profileImageConfig]);

  if (isLoading) {
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
          {children}
        </div>
      </main>
    </div>
  );
}
