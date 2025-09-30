"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";

import { useAccountKey } from "@/api/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, endpoints } from "@/lib/utils";
import { AccountLimitCheck } from "@/types/user";

import { deleteMultipleAccounts } from "./actions";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitCheck: AccountLimitCheck;
}

export function AccountSelectionModal({
  isOpen,
  onClose,
  limitCheck,
}: AccountSelectionModalProps) {
  const { accountKey: currentAccountKey } = useAccountKey();
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { accounts, accountLimit, userRole } = limitCheck;
  const excessCount = accounts.length - accountLimit;

  const handleAccountToggle = (accountKey: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountKey)
        ? prev.filter((key) => key !== accountKey)
        : [...prev, accountKey],
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedAccounts.length !== excessCount) {
      toast.error(`Please select exactly ${excessCount} account(s) to delete`);
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("accountKeys", JSON.stringify(selectedAccounts));

      const result = await deleteMultipleAccounts({}, formData);

      if (result && "error" in result) {
        throw new Error(result.error);
      }

      toast.success(
        result.success ||
          `Successfully deleted ${selectedAccounts.length} account(s)`,
      );

      globalMutate(endpoints.accounts);

      onClose();
    } catch (error) {
      console.error("Failed to delete accounts:", error);
      toast.error("Failed to delete accounts. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[80vh] max-w-3xl overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Account Limit Exceeded</DialogTitle>
          </div>
          <DialogDescription>
            Your subscription has been downgraded to{" "}
            <strong className="capitalize">{userRole}</strong>, which allows a
            maximum of <strong>{accountLimit}</strong> account
            {accountLimit === 1 ? "" : "s"}. You currently have{" "}
            <strong>{accounts.length}</strong> accounts.
            <br />
            <br />
            Please select <strong>{excessCount}</strong> account
            {excessCount === 1 ? "" : "s"} to delete:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {accounts.map((account) => {
            const isCurrentAccount = account.accountKey === currentAccountKey;
            const isSelected = selectedAccounts.includes(account.accountKey);

            return (
              <div
                key={account.accountKey}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border p-2 transition-all",
                  isSelected
                    ? "border-blue-400/50 bg-blue-900/20 ring-1 ring-blue-400"
                    : "border-gray-700 hover:border-gray-400 hover:bg-gray-700/50",
                )}
                onClick={() => handleAccountToggle(account.accountKey)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="cursor-pointer"
                    checked={isSelected}
                    onCheckedChange={() =>
                      handleAccountToggle(account.accountKey)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <h3 className="font-medium text-white">
                      {account.accountName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Created{" "}
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
                {isCurrentAccount && (
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <div className="my-auto flex-1 text-sm text-gray-500">
            Selected: {selectedAccounts.length} / {excessCount} required
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedAccounts.length !== excessCount || isDeleting}
          >
            {isDeleting
              ? "Deleting..."
              : `Delete ${selectedAccounts.length} Account${selectedAccounts.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
