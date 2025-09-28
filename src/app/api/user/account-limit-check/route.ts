import { getUserRole, getUserAccounts, getAccountLimitForRole } from "@/lib/db/queries";
import { AccountLimitCheck } from "@/types/user";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<AccountLimitCheck | { error: string }>> {
  try {
    const [userRole, accounts] = await Promise.all([
      getUserRole(),
      getUserAccounts(),
    ]);

    const accountLimit = getAccountLimitForRole(userRole);
    const hasExceededLimit = accounts.length > accountLimit;

    // Any user (basic, pro, etc.) who exceeds their limit needs to select accounts to keep
    const needsAccountSelection = hasExceededLimit;

    const response: AccountLimitCheck = {
      userRole,
      accountCount: accounts.length,
      accountLimit,
      hasExceededLimit,
      needsAccountSelection,
      accounts: needsAccountSelection ? accounts : [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to check account limits:", error);
    return NextResponse.json(
      { error: "Failed to check account limits" },
      { status: 500 }
    );
  }
}