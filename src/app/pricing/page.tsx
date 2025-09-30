import { ArrowLeft, Check } from "lucide-react";

import { Logo } from "@/components/global/logo";
import { Button } from "@/components/ui/button";
import { getUserRole } from "@/lib/db/queries";
import { checkoutAction, customerPortalAction } from "@/lib/payments/actions";
import { getStripePlans } from "@/lib/payments/stripe";
import { UserRole } from "@/types/user";

import { paths } from "@/lib/utils";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const prices = await getStripePlans();
  const userRole = await getUserRole();

  // Look for Basic and Pro plans (more flexible product name matching)
  const basicPrice = prices.find(
    (price) =>
      price.product?.name.toLowerCase().includes("basic") ||
      price.product?.name.toLowerCase().includes("base"),
  );
  const proPrice = prices.find(
    (price) =>
      price.product?.name.toLowerCase().includes("pro") ||
      price.product?.name.toLowerCase().includes("plus"),
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#111827]">
      {/* Back Button - Top of page */}
      <div className="p-6">
        <Link href={paths.settings.subscription}>
          <Button
            variant="ghost"
            className="text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center">
            <Logo gutterBottom />
            <h1 className="mb-2 text-4xl font-bold text-white">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-400">
              Take control of your financial future
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-2">
            <PricingCard
              name={basicPrice?.product?.name || "Basic"}
              price={basicPrice?.unitAmount || 0}
              interval={basicPrice?.interval || "month"}
              features={[
                "1 Account",
                "Advanced Analytics",
                "Unlimited Transactions",
                "Email Support",
              ]}
              priceId={basicPrice?.id}
              isFree={!basicPrice?.unitAmount || basicPrice.unitAmount === 0}
              userRole={userRole}
              planType="basic"
            />
            <PricingCard
              name={proPrice?.product?.name || "Pro"}
              price={proPrice?.unitAmount || 1200}
              interval={proPrice?.interval || "month"}
              features={[
                "Up to 5 Accounts",
                "Advanced Analytics",
                "Unlimited Transactions",
                "Priority Support",
              ]}
              priceId={proPrice?.id}
              featured={true}
              userRole={userRole}
              planType="pro"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function PricingCard({
  name,
  price,
  interval,
  features,
  priceId,
  featured = false,
  isFree = false,
  userRole,
  planType,
}: {
  name: string;
  price: number;
  interval: string;
  features: string[];
  priceId?: string;
  featured?: boolean;
  isFree?: boolean;
  userRole: UserRole;
  planType: "basic" | "pro";
}) {
  const isCurrentPlan = userRole === planType;
  const isDowngrade = userRole === "pro" && planType === "basic";
  const isUpgrade = userRole === "basic" && planType === "pro";

  const getButtonText = () => {
    if (isUpgrade) return "Upgrade to Pro";
    if (isDowngrade) return "Downgrade to Basic";
    return "Get Started";
  };

  const renderActionButton = () => {
    if (isCurrentPlan) {
      return (
        <Button variant="outline" className="w-full rounded-full" disabled>
          Current Plan
        </Button>
      );
    }

    if (isFree) {
      if (userRole === "pro") {
        return (
          <form action={customerPortalAction}>
            <SubmitButton text="Manage Subscription" />
          </form>
        );
      }
      return (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton text="Get Started" />
        </form>
      );
    }

    return (
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton text={getButtonText()} />
      </form>
    );
  };

  return (
    <div
      className={`relative rounded-lg border p-8 ${
        featured
          ? "border-blue-500 bg-gradient-to-br from-blue-900/20 to-[#1a2236] ring-2 ring-blue-500/50"
          : "border-gray-800 bg-[#1a2236]"
      }`}
    >
      {featured && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white">
          {isCurrentPlan ? "Current Plan" : "Most Popular"}
        </div>
      )}
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-2xl font-medium text-white">{name}</h2>
      </div>
      <p className="mb-4 text-sm text-gray-400">
        {isFree
          ? "Helping track your investment journey"
          : "Managing multiple investment accounts with ease"}
      </p>
      <p className="mb-6 text-4xl font-medium text-white">
        {isFree ? (
          "Free"
        ) : (
          <>
            £{price / 100}{" "}
            <span className="text-xl font-normal text-gray-400">
              per {interval}
            </span>
          </>
        )}
      </p>
      <ul className="mb-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-blue-500" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      {renderActionButton()}
    </div>
  );
}
