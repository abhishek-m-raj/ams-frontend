"use client"
import Link from "next/link"
import Image from "next/image"
import { SignInUserAuthForm } from "./user-auth-form"
import Logo from "@/components/logo"
import { useSearchParams } from "next/navigation"

export default function AuthenticationPage() {
  const redirectURL = useSearchParams().get("r") || ""
  return (
    <>
      <div className="relative flex min-h-screen flex-col md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
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
        <div className="flex w-full flex-1 items-center justify-center p-4 lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-87.5">
            <div className="flex flex-col gap-2 text-center">
              <Logo />
              <p className="text-muted-foreground text-sm">
                Enter your email to signin.
              </p>
            </div>
            <SignInUserAuthForm redirectUrl={redirectURL} />
            <p className="px-6 text-center text-xs text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}