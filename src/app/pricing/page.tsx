import { Button } from "@/components/ui/button";
import { checkoutAction } from "@/lib/payments/actions";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === "Base");
  const plusPlan = products.find((product) => product.name === "Plus");

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <div className="min-h-screen bg-[#0a101e] flex flex-col">
      {/* Back Button - Top of page */}
      <div className="p-6">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-gray-400 text-lg">Start your free trial today</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            <PricingCard
              name={basePlan?.name || "Base"}
              price={basePrice?.unitAmount || 800}
              interval={basePrice?.interval || "month"}
              trialDays={basePrice?.trialPeriodDays || 7}
              features={[
                "Unlimited Usage",
                "Unlimited Workspace Members",
                "Email Support",
              ]}
              priceId={basePrice?.id}
            />
            <PricingCard
              name={plusPlan?.name || "Plus"}
              price={plusPrice?.unitAmount || 1200}
              interval={plusPrice?.interval || "month"}
              trialDays={plusPrice?.trialPeriodDays || 7}
              features={[
                "Everything in Base, and:",
                "Early Access to New Features",
                "24/7 Support + Slack Access",
              ]}
              priceId={plusPrice?.id}
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
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`bg-[#1a2236] border border-gray-800 rounded-lg p-8 ${
        featured ? "ring-2 ring-blue-500 ring-opacity-50" : ""
      }`}
    >
      {featured && (
        <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
          Most Popular
        </div>
      )}
      <h2 className="text-2xl font-medium text-white mb-2">{name}</h2>
      <p className="text-sm text-gray-400 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-white mb-6">
        ${price / 100}{" "}
        <span className="text-xl font-normal text-gray-400">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
