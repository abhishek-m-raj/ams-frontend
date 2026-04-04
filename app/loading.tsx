"use client";

import { Loader2 } from "lucide-react";
import Logo from "@/components/logo";

export default function Loading() {
    return (
        <div className="relative flex w-dvw h-dvh justify-center items-center bg-zinc-50 dark:bg-black">
            <Logo />
            <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 -translate-x-1/2">
                <Loader2 size={10} className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-foreground" />
            </div>
        </div>
    );
}