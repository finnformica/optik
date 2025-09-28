"use client";

import { useUserSubscription } from "@/api/user";
import { Loading } from "@/components/global/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerPortalAction } from "@/lib/payments/actions";
import { UserRole } from "@/types/user";
import { CreditCard, Crown, Loader2, User } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function SubscriptionInfo() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { subscription, isLoading } = useUserSubscription();

  const handleManageSubscription = async () => {
    try {
      setIsRedirecting(true);
      await customerPortalAction();
    } catch (error) {
      toast.error("Error opening subscription management. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isLoading || !subscription) {
    return <Loading message="Loading subscription data..." />;
  }

  const getPlanIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "pro":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPlanBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-yellow-600 text-yellow-100";
      case "pro":
        return "bg-blue-600 text-blue-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const getAccountLimit = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Unlimited";
      case "pro":
        return "5 accounts";
      default:
        return "1 account";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-gray-800 bg-[#1a2236] shadow-xl">
        <CardContent className="px-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-3 ${subscription.role === "admin" ? "bg-yellow-500/20" : subscription.role === "pro" ? "bg-blue-500/20" : "bg-gray-500/20"}`}
              >
                {getPlanIcon(subscription.role)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Current Plan
                </h3>
                <p className="text-sm text-gray-400">
                  Your active subscription
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`px-4 py-2 text-sm font-semibold capitalize ${getPlanBadgeColor(subscription.role)}`}
            >
              {subscription.role}
            </Badge>
          </div>

          <div className="flex justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Account Limit
              </p>
              <p className="text-lg font-semibold text-white">
                {getAccountLimit(subscription.role)}
              </p>
            </div>

            {subscription.currentPeriodEnd && (
              <div className="space-y-1 text-right">
                <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                  {subscription.subscriptionStatus === "canceled" ||
                  subscription.cancelAtPeriodEnd
                    ? "Access Until"
                    : "Next Billing"}
                </p>
                <p className="text-lg font-semibold text-white">
                  {subscription.currentPeriodEnd &&
                    new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management Card */}
      <Card className="border-gray-800 bg-[#1a2236]">
        <CardHeader>
          <CardTitle className="text-white">Subscription Management</CardTitle>
          <p className="text-sm text-gray-400">
            Manage your subscription, billing details, and payment methods
            through the Stripe customer portal.
          </p>
        </CardHeader>
        <CardContent>
          {subscription.hasActiveSubscription ? (
            <div className="space-y-4">
              <Button
                onClick={handleManageSubscription}
                disabled={isRedirecting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Customer Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                You're currently on the Basic plan. Upgrade to Pro to connect
                more accounts and access advanced features.
              </p>
              <Button
                onClick={() => (window.location.href = "/pricing")}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <section className="flex-1">
      <h1 className="mb-4 text-xl font-semibold text-white">
        Subscription Settings
      </h1>

      <Suspense
        fallback={
          <Card className="border-gray-800 bg-[#1a2236]">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading subscription information...</span>
              </div>
            </CardContent>
          </Card>
        }
      >
        <SubscriptionInfo />
      </Suspense>
    </section>
  );
}
