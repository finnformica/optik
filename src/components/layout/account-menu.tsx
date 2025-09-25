"use client";

import { Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGetUserAccounts } from "@/api/accounts";
import { useCurrentAccountKey } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup as DropdownMenuRadioGroupPrimitive,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSWRConfig } from "swr";
import AccountForm from "./account-form";
import { deleteAccount, switchAccount } from "./actions";

export function AccountMenu() {
  const { mutate: globalMutate } = useSWRConfig();
  const { accounts, mutate } = useGetUserAccounts();
  const currentAccountKey = useCurrentAccountKey();

  const [loading, setLoading] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  const handleAccountSwitch = async (accountKey: number) => {
    const formData = new FormData();
    formData.append("accountKey", accountKey.toString());

    switchAccount({}, formData).then(() => {
      // Invalidate all API routes
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/"));
    });
  };

  const handleDeleteConfirm = async () => {
    if (accountToDelete) {
      setLoading(true);
      const formData = new FormData();
      formData.append("accountKey", accountToDelete.toString());
      await deleteAccount({}, formData).then(() => {
        mutate();
        setAccountToDelete(null);
        setLoading(false);
      });
    }
  };

  return (
    <DropdownMenu>
      <Tooltip key="accounts">
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-center p-4 mb-2 mx-2 rounded-lg cursor-pointer transition-all hover:bg-gray-800">
              <Users className="h-5 w-5" />
            </div>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" showArrow={false} sideOffset={10}>
          Accounts
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-56" side="right">
        <DropdownMenuLabel>Select account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroupPrimitive
          value={currentAccountKey?.toString() || ""}
          onValueChange={(value) => handleAccountSwitch(Number(value))}
        >
          {accounts?.map((account) => (
            <div
              key={account.accountKey}
              className="flex items-center rounded-sm justify-between hover:bg-accent hover:text-accent-foreground"
            >
              <DropdownMenuRadioItem
                className="cursor-pointer flex-1 hover:bg-transparent hover:text-current"
                value={account.accountKey.toString()}
              >
                {account.accountName}
              </DropdownMenuRadioItem>
              <div className="flex mr-0.5">
                <AccountForm
                  mode="edit"
                  account={account}
                  refresh={() => mutate()}
                  trigger={
                    <DropdownMenuItem
                      className="cursor-pointer p-1"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Edit className="h-4 w-4" />
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem
                  className="cursor-pointer p-1 text-red-600 hover:text-red-700"
                  onSelect={(e) => {
                    e.preventDefault();

                    if (currentAccountKey === account.accountKey) {
                      toast.error("Current account cannot be deleted");
                      return;
                    }

                    setAccountToDelete(account.accountKey);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </DropdownMenuItem>
              </div>
            </div>
          ))}
        </DropdownMenuRadioGroupPrimitive>
        <DropdownMenuSeparator />
        <AccountForm
          mode="create"
          refresh={() => mutate()}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <Plus className="h-5 w-5" />
              Add account
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>

      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
