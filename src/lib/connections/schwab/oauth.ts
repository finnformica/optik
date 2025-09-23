import { getAccountKey } from "@/lib/auth/session";
import { TokenEncryption } from "@/lib/auth/token-encryption";
import { db } from "@/lib/db/config";
import { SchwabActivity } from "@/lib/db/etl/queries";
import { dimAccountAccessToken } from "@/lib/db/schema";
import { endpoints } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

interface SchwabTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class SchwabAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchwabAuthenticationError";
  }
}

export class SchwabTokenRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchwabTokenRefreshError";
  }
}

export class SchwabAuth {
  private appKey: string;
  private appSecret: string;
  private baseUrl: string = "https://api.schwabapi.com";
  private redirectUri: string;

  constructor() {
    if (!process.env.SCHWAB_APP_KEY) {
      throw new Error("SCHWAB_APP_KEY environment variable is required");
    }
    if (!process.env.SCHWAB_APP_SECRET) {
      throw new Error("SCHWAB_APP_SECRET environment variable is required");
    }

    this.appKey = process.env.SCHWAB_APP_KEY;
    this.appSecret = process.env.SCHWAB_APP_SECRET;
    this.redirectUri = process.env.BASE_URL + endpoints.auth.schwab.callback;
  }

  // Store tokens
  async storeTokens(tokens: SchwabTokens): Promise<void> {
    const accountKey = await getAccountKey();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Encrypt token data
    const sensitiveData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };

    const encryptedTokens = TokenEncryption.encrypt(
      JSON.stringify(sensitiveData)
    );

    try {
      await db
        .insert(dimAccountAccessToken)
        .values({
          accountKey,
          encryptedTokens,
          expiresAt,
          tokenType: tokens.token_type,
          scope: tokens.scope,
          brokerCode: "schwab",
        })
        .onConflictDoUpdate({
          target: [
            dimAccountAccessToken.accountKey,
            dimAccountAccessToken.brokerCode,
          ],
          set: {
            encryptedTokens,
            expiresAt,
            tokenType: tokens.token_type,
            scope: tokens.scope,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      throw new Error(
        `Failed to store tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Retrieve and decrypt tokens
  async getStoredTokens(): Promise<SchwabTokens | null> {
    const accountKey = await getAccountKey();

    try {
      const data = await db
        .select()
        .from(dimAccountAccessToken)
        .where(
          and(
            eq(dimAccountAccessToken.accountKey, accountKey),
            eq(dimAccountAccessToken.brokerCode, "schwab")
          )
        );

      if (!data || data.length === 0) {
        return null;
      }

      const tokenRecord = data[0];

      try {
        // Decrypt token data
        const decryptedData = TokenEncryption.decrypt(
          tokenRecord.encryptedTokens
        );
        const sensitiveTokens = JSON.parse(decryptedData);

        return {
          access_token: sensitiveTokens.access_token,
          refresh_token: sensitiveTokens.refresh_token,
          expires_in: Math.floor(
            (tokenRecord.expiresAt.getTime() - Date.now()) / 1000
          ),
          token_type: tokenRecord.tokenType,
          scope: tokenRecord.scope,
        };
      } catch (decryptionError) {
        console.error("Failed to decrypt tokens:", decryptionError);
        return null;
      }
    } catch (error) {
      console.error("Failed to retrieve tokens:", error);
      return null;
    }
  }

  // Enhanced token refresh with retry logic
  async refreshAccessTokenSecurely(): Promise<string> {
    const tokens = await this.getStoredTokens();

    if (!tokens) {
      throw new SchwabAuthenticationError(
        "No tokens found. Schwab account needs to re-authenticate."
      );
    }

    // Check if token expires within next 5 minutes
    if (tokens.expires_in > 300) {
      return tokens.access_token;
    }

    try {
      const newTokens = await this.refreshAccessToken(tokens.refresh_token);
      await this.storeTokens(newTokens);
      return newTokens.access_token;
    } catch (error) {
      // If refresh fails, account needs to re-authenticate
      await this.clearStoredTokens();
      throw new SchwabTokenRefreshError(
        "Token refresh failed. Schwab account needs to re-authenticate."
      );
    }
  }

  // Clear tokens (for logout or failed refresh)
  async clearStoredTokens(): Promise<void> {
    const accountKey = await getAccountKey();
    try {
      await db
        .delete(dimAccountAccessToken)
        .where(
          and(
            eq(dimAccountAccessToken.accountKey, accountKey),
            eq(dimAccountAccessToken.brokerCode, "schwab")
          )
        );
    } catch (error) {
      console.error("Failed to clear tokens:", error);
      throw new Error(
        `Failed to clear tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.appKey,
      redirect_uri: this.redirectUri,
    });

    const authUrl = `${this.baseUrl}/v1/oauth/authorize?${params.toString()}`;
    return authUrl;
  }

  // Exchange authorization code for access tokens
  async exchangeCodeForTokens(
    authorizationCode: string,
    redirectUri: string
  ): Promise<SchwabTokens> {
    const credentials = btoa(`${this.appKey}:${this.appSecret}`);

    const response = await fetch(`${this.baseUrl}/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange error details:", errorText);
      throw new Error(
        `Token exchange failed: ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<SchwabTokens> {
    const credentials = btoa(`${this.appKey}:${this.appSecret}`);

    const response = await fetch(`${this.baseUrl}/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed: ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const accessToken = await this.refreshAccessTokenSecurely();

    // Build headers based on the request method
    const defaultHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    // Only add Content-Type for non-GET requests (Schwab API will fail if this improperly configured)
    if (options.method && options.method !== "GET") {
      defaultHeaders["Content-Type"] = "application/json";
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  }

  // Get account numbers and hashes for the authenticated account
  async getAccountNumbers(): Promise<SchwabAccountInfo[]> {
    const response = await this.makeAuthenticatedRequest(
      "/trader/v1/accounts/accountNumbers",
      { method: "GET" }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get account numbers: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  // Get transaction history for a specific account
  async getTransactionHistory(
    accountHash: string, // Schwab Account hash
    fromDate: Date,
    toDate?: Date
  ): Promise<SchwabActivity[]> {
    const endDate = toDate || new Date();
    let allTransactions: SchwabActivity[] = [];

    // Schwab API limits date ranges to 1 year maximum
    // Break the request into 1-year chunks
    let currentStartDate = new Date(fromDate);

    while (currentStartDate < endDate) {
      // Calculate end date for this batch (1 year from start, or final end date if sooner)
      const currentEndDate = new Date(currentStartDate);
      currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);

      // Don't exceed the final end date
      if (currentEndDate > endDate) {
        currentEndDate.setTime(endDate.getTime());
      }

      try {
        const batchTransactions = await this.getTransactionHistoryBatch(
          accountHash,
          currentStartDate,
          currentEndDate
        );

        allTransactions.push(...batchTransactions);
      } catch (error) {
        if (
          error instanceof SchwabAuthenticationError ||
          error instanceof SchwabTokenRefreshError
        ) {
          throw error;
        }

        // Continue with next batch even if one fails
        console.error(
          `Failed to fetch batch ${
            currentStartDate.toISOString().split("T")[0]
          } to ${currentEndDate.toISOString().split("T")[0]}:`,
          error
        );
      }

      // Move to next year
      currentStartDate = new Date(currentEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1); // Start the day after the previous batch ended
    }

    return allTransactions;
  }

  // Helper method to fetch a single batch (max 1 year)
  private async getTransactionHistoryBatch(
    accountHash: string,
    fromDate: Date,
    toDate: Date
  ): Promise<SchwabActivity[]> {
    // Schwab expects dates in full ISO string format
    const fromDateStr = fromDate.toISOString();
    const toDateStr = toDate.toISOString();

    // Types include:
    // TRADE, RECEIVE_AND_DELIVER, DIVIDEND_OR_INTEREST,
    // ACH_RECEIPT, ACH_DISBURSEMENT, CASH_RECEIPT,
    // CASH_DISBURSEMENT, ELECTRONIC_FUND, WIRE_OUT, WIRE_IN,
    // JOURNAL, MEMORANDUM, MARGIN_CALL, MONEY_MARKET, SMA_ADJUSTMENT
    const params = new URLSearchParams({
      startDate: fromDateStr,
      endDate: toDateStr,
      types: "TRADE,RECEIVE_AND_DELIVER,DIVIDEND_OR_INTEREST,WIRE_OUT,WIRE_IN",
    });

    const endpoint = `/trader/v1/accounts/${accountHash}/transactions?${params.toString()}`;
    const response = await this.makeAuthenticatedRequest(endpoint, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get transaction history: ${response.statusText} - ${errorText}`
      );
    }

    const transactions = await response.json();
    return Array.isArray(transactions) ? transactions : [];
  }
}

interface SchwabAccountInfo {
  accountNumber: string;
  hashValue: string;
}
