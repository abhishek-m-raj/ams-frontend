import { Metadata } from "next"
import Image from "next/image"
import { SignUpUserAuthForm } from "./user-auth-form"

export const metadata: Metadata = {
  title: "AMS - Onboarding",
  description: "Academic Management System - University College of Engineering, Kariavattom",
}

export default function OnboardingPage() {
  return (
    <>
      <div className="relative flex min-h-screen flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 lg:overflow-hidden">
        <div className="relative flex h-[45vh] flex-col overflow-hidden bg-muted p-6 text-white lg:h-full lg:p-10 dark:border-r">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 lg:scale-100" 
            style={{ backgroundImage: "url('/ucek.jpeg')" }} 
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Image src="/logo-ucek.svg" alt="Logo" width={56} height={56} className="mr-2 h-10 w-auto lg:h-14 brightness-0 invert" />
          </div>
        </div>
        <div className="w-full items-center justify-center lg:p-0 lg:h-screen lg:overflow-y-auto">
          <div className="mx-auto h-full items-center w-full justify-center gap-6 p-4 pt-8 lg:p-8 sm:w-87.5 lg:w-120">
            <SignUpUserAuthForm />
          </div>
        </div>
      </div>
    </>
  )
}