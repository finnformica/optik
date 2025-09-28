"use client";

import { useUser, useUserRole, useUserSubscription } from "@/api/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerPortalAction } from "@/lib/payments/actions";
import { CreditCard, Crown, Loader2, User } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function SubscriptionInfo() {
  const { user } = useUser();
  const { role: currentPlan, isLoading: roleLoading } = useUserRole();
  const { subscription, isLoading: subscriptionLoading } = useUserSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setIsRedirecting(true);
      await customerPortalAction();
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Error opening subscription management. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };

  if (!user || roleLoading || subscriptionLoading || !currentPlan || !subscription) {
    return <div className="text-gray-400">Loading user information...</div>;
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "admin":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "pro":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "admin":
        return "bg-yellow-600 text-yellow-100";
      case "pro":
        return "bg-blue-600 text-blue-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const getAccountLimit = (plan: string) => {
    switch (plan) {
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
      <Card className="border-gray-800 bg-[#1a2236]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {getPlanIcon(currentPlan)}
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Plan:</span>
            <span
              className={`rounded-full px-2 py-1 text-sm font-medium capitalize ${getPlanBadgeColor(currentPlan)}`}
            >
              {currentPlan}
            </span>
          </div>

          {subscription.subscriptionStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="font-medium text-white capitalize">
                {subscription.subscriptionStatus}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-300">Account Limit:</span>
            <span className="font-medium text-white">
              {getAccountLimit(currentPlan)}
            </span>
          </div>

          {subscription.planName && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Stripe Plan:</span>
              <span className="font-medium text-white">{subscription.planName}</span>
            </div>
          )}
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
