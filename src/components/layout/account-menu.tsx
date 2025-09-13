"use client";

import { Edit, Plus, Users } from "lucide-react";

import { useGetUserAccounts } from "@/api/accounts";
import { useSession } from "@/components/providers/session-provider";
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
import AccountForm from "./account-form";
import { switchAccount } from "./actions";

export function AccountMenu() {
  const { accounts, mutate } = useGetUserAccounts();
  const { session } = useSession();

  const handleAccountSwitch = async (accountKey: number) => {
    const formData = new FormData();
    formData.append("accountKey", accountKey.toString());

    await switchAccount({}, formData);
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
          value={session.accountKey.toString()}
          onValueChange={(value) => handleAccountSwitch(Number(value))}
        >
          {accounts?.map((account) => (
            <div
              key={account.accountKey}
              className="flex items-center justify-between"
            >
              <DropdownMenuRadioItem
                className="cursor-pointer flex-1"
                value={account.accountKey.toString()}
              >
                {account.accountName}
              </DropdownMenuRadioItem>
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
