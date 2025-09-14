"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DimAccount } from "@/lib/db/schema";

import { createAccount, updateAccount } from "./actions";

interface AccountFormProps {
  refresh: () => void;
  account?: DimAccount;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
}

export default function AccountForm({
  account,
  trigger,
  refresh,
  mode = "create",
}: AccountFormProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setErrors({});

    startTransition(async () => {
      let result;

      if (mode === "create") {
        result = await createAccount({}, formData);
      } else if (account) {
        // Add accountKey to formData for update
        formData.append("accountKey", account.accountKey.toString());
        result = await updateAccount({}, formData);
      }

      if (result && "error" in result) {
        setErrors({ accountName: [result.error] });
      } else if (result && "success" in result) {
        setOpen(false);
        refresh();
      }
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {mode === "create" ? "Add Account" : "Edit Account"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create New Account" : "Edit Account"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a new account to organise your investments."
                : "Update your account information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                name="accountName"
                defaultValue={account?.accountName || ""}
                placeholder="e.g., My Investment Account"
                className={errors.accountName ? "border-red-500" : ""}
              />
              {errors.accountName && (
                <p className="text-sm text-red-500">{errors.accountName[0]}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create Account"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
