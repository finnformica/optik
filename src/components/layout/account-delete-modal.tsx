"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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

import { deleteAccount } from "./actions";

interface AccountDeleteModalProps {
  accountKey: number;
  accountName: string;
  refresh: () => void;
  trigger: React.ReactNode;
}

export default function AccountDeleteModal({
  accountKey,
  accountName,
  refresh,
  trigger,
}: AccountDeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("accountKey", accountKey.toString());

        const result = await deleteAccount({}, formData);

        if (result && "error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Account deleted successfully");
          setOpen(false);
          refresh();
        }
      } catch (error) {
        console.error("Failed to delete account:", error);
        toast.error("Failed to delete account. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{accountName}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
