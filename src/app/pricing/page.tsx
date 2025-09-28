import { Button } from "@/components/ui/button";
import { checkoutAction } from "@/lib/payments/actions";
import { getStripePlans } from "@/lib/payments/stripe";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const prices = await getStripePlans();

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
    <div className="flex min-h-screen flex-col bg-[#0a101e]">
      {/* Back Button - Top of page */}
      <div className="p-6">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-white">
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
              trialDays={basicPrice?.trialPeriodDays || 0}
              features={[
                "1 Account",
                "Advanced Analytics",
                "Unlimited Transactions",
                "Email Support",
              ]}
              priceId={basicPrice?.id}
              isFree={!basicPrice?.unitAmount || basicPrice.unitAmount === 0}
            />
            <PricingCard
              name={proPrice?.product?.name || "Pro"}
              price={proPrice?.unitAmount || 1200}
              interval={proPrice?.interval || "month"}
              trialDays={proPrice?.trialPeriodDays || 7}
              features={[
                "Up to 5 Accounts",
                "Advanced Analytics",
                "Unlimited Transactions",
                "Priority Support",
              ]}
              priceId={proPrice?.id}
              featured={true}
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
  trialDays,
  features,
  priceId,
  featured = false,
  isFree = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  featured?: boolean;
  isFree?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border border-gray-800 bg-[#1a2236] p-8 ${
        featured ? "ring-opacity-50 ring-2 ring-blue-500" : ""
      }`}
    >
      {featured && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white">
          Most Popular
        </div>
      )}
      <h2 className="text-2xl font-medium text-white">{name}</h2>
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
      {isFree ? (
        <Button variant="outline" className="w-full rounded-full" disabled>
          Current Plan
        </Button>
      ) : (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
