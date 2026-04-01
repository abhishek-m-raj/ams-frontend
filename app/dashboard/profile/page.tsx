"use client";

import ProfileForm from "@/components/profile/profile-form";
import Avatar, { genConfig } from 'react-nice-avatar';
import { Avatar as AvatarIcon, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, isLoading, session } = useAuth();

  const profileImageConfig: ReturnType<typeof genConfig> = useMemo(() => {
    const gender = user?.gender?.toLowerCase();
    const userGender: "man" | "woman" = gender == "male" || gender === "man" ? "man" : "woman";
    const randomConfig = genConfig(user?.email || "");
    return {
      ...randomConfig,
      sex: userGender,
    };
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-12 px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left summary (inline) */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                 {(user.image !== undefined && user.image != "" && user.image != "gen" ?
                  <AvatarIcon className="h-16 w-16">
                    <AvatarImage src={user.image || ''} alt={user.first_name || 'User'} />
                    <AvatarFallback className="text-[8px]">{user.first_name?.[0] || 'U'}</AvatarFallback>
                  </AvatarIcon> :
                  <Avatar {...profileImageConfig} {...(()=> {console.log("Profile image config:", profileImageConfig); return {}})()} className="h-16 w-16" />
                )
                }

                <div>
                  <div className="text-lg font-semibold">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                </div>
              </div>

              <div className="mt-6 text-sm text-muted-foreground space-y-2">
                <div className="flex">
                  <span className="font-medium w-28">Phone:</span>
                  <span>{user.phone ?? "—"}</span>
                </div>

                <div className="flex">
                  <span className="font-medium w-28">Gender:</span>
                  <span>{user.gender ?? "—"}</span>
                </div>

                {user.role === "student" && (
                  <>
                    <div className="flex">
                      <span className="font-medium w-28">Admission No:</span>
                      <span>{user.adm_number ?? "—"}</span>
                    </div>

                    <div className="flex">
                      <span className="font-medium w-28">Department:</span>
                      <span>{user.department ?? "—"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>  
          </div>

          {/* Right form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <ProfileForm initialUser={user} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
