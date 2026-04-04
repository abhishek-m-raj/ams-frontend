"use client";

import Image from "next/image";
import { ThemeToggle } from "./theme_toggle";
import { ProfileBtn } from "./profile";
import Logo from "../logo";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-2 sm:px-8 border-b bg-background">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-between gap-2">
          <Logo className="h-10 w-10"/> 
          <span className="hidden sm:block">/</span> 
          <div className="gap-2 items-center-safe hidden sm:flex rounded-sm text-xs bg-muted px-3 py-1 m-2">
            <Image src="/logo-ucek.svg" alt="UCEK Logo" width={40} height={40} className="dark:invert" />
            <div className="font-semibold flex flex-col leading-tight">
               University College of Engineering
               <span className="font-normal">Kariavattom</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <ThemeToggle />
        <ProfileBtn />
      </div>
    </header>
  );
}
