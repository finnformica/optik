"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionState } from "@/lib/auth/middleware";
import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { resendConfirmation } from "@/app/(auth)/actions";

interface ResendConfirmationDialogProps {
  defaultEmail?: string;
}

export function ResendConfirmationDialog({
  defaultEmail = "",
}: ResendConfirmationDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resendConfirmation,
    { error: "" },
  );

  // Close dialog on success
  if (state?.success && open) {
    setTimeout(() => setOpen(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Need a new confirmation email?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#1a2236] border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">
            Resend Confirmation Email
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Enter your email address to receive a new confirmation email.
          </DialogDescription>
        </DialogHeader>

        {state?.success ? (
          <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
            <div className="text-green-400 text-sm text-center">
              {state.success}
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={defaultEmail}
                required
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-[#111827] focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {state?.error && (
              <div className="text-red-400 text-sm">{state.error}</div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}