"use client"
import { useAuth } from "@/lib/auth-context";
import StudentDashboardPage from "./(student)/home"
import AdminDashboardPage from "./(admin)/home";
import TeacherDashboardPage from "./(teacher)/home";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";

export default function DashboardPage() {
    const {user, incompleteProfile, isLoading} = useAuth();
    const router = useRouter();

    useEffect(() => {
      // If incomplete profile, redirect to onboarding
      if (!isLoading && incompleteProfile) {
        router.push('/onboarding');
      }
    }, [isLoading, incompleteProfile, router]);

    // Show loading while checking status
    if (isLoading || incompleteProfile) {
      return <Loading />;
    }

    const role = user?.role;

    if (role === "student") return <StudentDashboardPage />
    if(role === "admin" || role === "principal") return <AdminDashboardPage />
    if(role === "teacher" || role === "hod") return <TeacherDashboardPage />

    return <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p>Your role &quot;{role}&quot; does not have a dashboard implemented yet.</p>
    </div>
}