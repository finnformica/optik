"use client";

import { Edit, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { useGetUserAccounts } from "@/api/accounts";
import { useAccountKey } from "@/api/user";
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

import AccountDeleteModal from "./account-delete-modal";
import AccountForm from "./account-form";
import { switchAccount } from "./actions";

export function AccountMenu() {
  const { mutate: globalMutate } = useSWRConfig();
  const { accounts, mutate } = useGetUserAccounts();
  const { accountKey, refresh } = useAccountKey();

  const handleAccountSwitch = async (accountKey: number) => {
    const formData = new FormData();
    formData.append("accountKey", accountKey.toString());

    switchAccount({}, formData).then(() => {
      // Refresh account key and invalidate all API routes
      refresh();
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/"));
    });
  };

  return (
    <DropdownMenu>
      <Tooltip key="accounts">
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <div className="mx-2 mb-2 flex cursor-pointer items-center justify-center rounded-lg p-4 transition-all hover:bg-gray-800">
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
          value={accountKey?.toString() || ""}
          onValueChange={(value) => handleAccountSwitch(Number(value))}
        >
          {accounts?.map((account) => (
            <div
              key={account.accountKey}
              className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-sm"
            >
              <DropdownMenuRadioItem
                className="flex-1 cursor-pointer hover:bg-transparent hover:text-current"
                value={account.accountKey.toString()}
              >
                {account.accountName}
              </DropdownMenuRadioItem>
              <div className="mr-0.5 flex">
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
                <AccountDeleteModal
                  accountKey={account.accountKey}
                  accountName={account.accountName ?? ""}
                  refresh={() => mutate()}
                  trigger={
                    <DropdownMenuItem
                      className="cursor-pointer p-1 text-red-600 hover:text-red-700"
                      onSelect={(e) => {
                        e.preventDefault();

                        if (accountKey === account.accountKey) {
                          toast.error("Current account cannot be deleted");
                          return;
                        }
                      }}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </DropdownMenuItem>
                  }
                />
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
    </DropdownMenu>
  );
}
