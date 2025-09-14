// DELETE FILE ONCE NEW CALLBACK URL IS APPROVED

import { SchwabAuth } from "@/lib/connections/schwab/oauth";
import { syncSchwabBrokerAccounts } from "@/lib/db/etl/broker-accounts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.BASE_URL || request.nextUrl.origin;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Schwab OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings/connections?error=oauth_error&provider=schwab`,
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/settings/connections?error=no_code&provider=schwab`,
      );
    }

    const schwabAuth = new SchwabAuth();
    const redirectUri = `${baseUrl}/api/auth/schwab/callback`;

    try {
      // Exchange the authorization code for tokens
      const tokens = await schwabAuth.exchangeCodeForTokens(code, redirectUri);

      // Store the tokens securely
      await schwabAuth.storeTokens(tokens);

      // Sync broker accounts - this is critical for data ingestion to work
      await syncSchwabBrokerAccounts();

      return NextResponse.redirect(
        `${baseUrl}/settings/connections?success=connected&provider=schwab`,
      );
    } catch (tokenError) {
      console.error("Token exchange or account sync error:", tokenError);
      return NextResponse.redirect(
        `${baseUrl}/settings/connections?error=setup_failed&provider=schwab`,
      );
    }
  } catch (error) {
    console.error("Schwab OAuth callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/connections?error=callback_error&provider=schwab`,
    );
  }
}
