import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { userAccessTokens } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { CheckCircle, ExternalLink, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { connectSchwab, disconnectSchwab } from "./actions";

async function getSchwabConnectionStatus(userId: number) {
  try {
    const token = await db
      .select()
      .from(userAccessTokens)
      .where(
        and(
          eq(userAccessTokens.userId, userId),
          eq(userAccessTokens.broker, "schwab")
        )
      )
      .limit(1);

    if (token.length === 0) {
      return { connected: false, expiresAt: null };
    }

    const tokenRecord = token[0];
    const isExpired = tokenRecord.expiresAt < new Date();

    return {
      connected: !isExpired,
      expiresAt: tokenRecord.expiresAt,
    };
  } catch (error) {
    return { connected: false, expiresAt: null };
  }
}

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    provider?: string;
  }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { connected, expiresAt } = await getSchwabConnectionStatus(userId);

  const errorMessages = {
    oauth_error: "OAuth authentication was cancelled or failed",
    no_code: "No authorization code received",
    token_exchange_failed: "Failed to exchange authorization code for tokens",
    callback_error: "An error occurred during the OAuth callback",
    not_authenticated: "You must be logged in to connect your account",
  };

  const successMessages = {
    connected: "Successfully connected!",
  };

  const getProviderDisplayName = (provider?: string) => {
    switch (provider) {
      case "schwab":
        return "Schwab";
      case "td_ameritrade":
        return "TD Ameritrade";
      case "etrade":
        return "E*TRADE";
      case "fidelity":
        return "Fidelity";
      case "vanguard":
        return "Vanguard";
      default:
        return provider || "Account";
    }
  };

  return (
    <section className="flex-1">
      <h1 className="text-xl font-semibold text-white mb-4">Connections</h1>

      {/* Success Messages */}
      {params.success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-400">
            {`${getProviderDisplayName(params.provider)}: ${
              successMessages[params.success as keyof typeof successMessages] ||
              "Operation completed successfully"
            }`}
          </p>
        </div>
      )}

      {/* Error Messages */}
      {params.error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">
            {`${getProviderDisplayName(params.provider)}: ${
              errorMessages[params.error as keyof typeof errorMessages] ||
              "An error occurred"
            }`}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Schwab Connection */}
        <Card className="bg-[#1a2236] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <CardTitle className="text-white">Schwab</CardTitle>
                  <p className="text-gray-400 text-sm">
                    Connect your Schwab account to import portfolio data
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {connected ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-900/20 text-green-400 border-green-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-gray-300 border-gray-600"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connected && expiresAt && (
                <div className="text-sm text-gray-400">
                  <p>
                    Token expires: {expiresAt.toLocaleDateString()} at{" "}
                    {expiresAt.toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                {connected ? (
                  <form action={disconnectSchwab}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      Disconnect
                    </Button>
                  </form>
                ) : (
                  <form action={connectSchwab}>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Schwab
                    </Button>
                  </form>
                )}

                {connected && (
                  <Button
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    Refresh Data
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>Connecting to Schwab allows us to:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Import your portfolio holdings</li>
                  <li>Track account performance</li>
                  <li>Analyze your investment strategy</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Connections */}
        <Card className="bg-[#1a2236] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              More Connections Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TD</span>
                </div>
                <div>
                  <p className="text-white font-medium">TD Ameritrade</p>
                  <p className="text-gray-400 text-xs">Coming soon</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">ET</span>
                </div>
                <div>
                  <p className="text-white font-medium">E*TRADE</p>
                  <p className="text-gray-400 text-xs">Coming soon</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">FI</span>
                </div>
                <div>
                  <p className="text-white font-medium">Fidelity</p>
                  <p className="text-gray-400 text-xs">Coming soon</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">V</span>
                </div>
                <div>
                  <p className="text-white font-medium">Vanguard</p>
                  <p className="text-gray-400 text-xs">Coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
