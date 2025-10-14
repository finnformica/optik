"use client";

import { ResendConfirmationDialog } from "@/components/auth/resend-confirmation-dialog";
import { Logo } from "@/components/global/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionState } from "@/lib/auth/middleware";
import { paths } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn, signUp } from "./actions";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const inviteId = searchParams.get("inviteId");
  const confirmation = searchParams.get("confirmation");
  const verified = searchParams.get("verified");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "signin" ? signIn : signUp,
    { error: "" },
  );

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center bg-[#111827] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          {mode === "signin"
            ? "Sign in to your account"
            : "Create your account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {confirmation === "true" && (
          <Alert variant="info" className="mb-6">
            <AlertDescription>
              Email confirmation sent. Please check your email to confirm your
              account.
            </AlertDescription>
          </Alert>
        )}
        {verified === "true" && (
          <Alert variant="success" className="mb-6">
            <AlertDescription>
              Email verified successfully! You can now sign in to your account.
            </AlertDescription>
          </Alert>
        )}
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ""} />
          <input type="hidden" name="priceId" value={priceId || ""} />
          <input type="hidden" name="inviteId" value={inviteId || ""} />

          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-300"
                >
                  First Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    defaultValue={state.firstName}
                    required
                    maxLength={50}
                    className="relative block w-full appearance-none rounded-full border border-gray-600 bg-[#1a2236] px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-300"
                >
                  Last Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    defaultValue={state.lastName}
                    required
                    maxLength={50}
                    className="relative block w-full appearance-none rounded-full border border-gray-600 bg-[#1a2236] px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="relative block w-full appearance-none rounded-full border border-gray-600 bg-[#1a2236] px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="relative block w-full appearance-none rounded-full border border-gray-600 bg-[#1a2236] px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-sm text-red-500">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="flex w-full items-center justify-center rounded-full border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#111827] px-2 text-gray-400">
                {mode === "signin"
                  ? "New to our platform?"
                  : "Already have an account?"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${
                mode === "signin" ? paths.auth.signUp : paths.auth.signIn
              }${redirect ? `?redirect=${redirect}` : ""}${
                priceId ? `&priceId=${priceId}` : ""
              }`}
              className="flex w-full justify-center rounded-full border border-gray-600 bg-[#1a2236] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              {mode === "signin"
                ? "Create an account"
                : "Sign in to existing account"}
            </Link>
          </div>

          {/* Resend confirmation email link */}
          <div className="mt-8 text-center">
            <ResendConfirmationDialog defaultEmail={state.email || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
