import { CheckCircle } from "lucide-react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Pricing() {
  const plans = [
    {
      name: "Basic",
      description: "Helping track your investment journey",
      price: "Free",
      features: [
        "1 Account",
        "Advanced Analytics",
        "Unlimited Transactions",
        "Email Support",
      ],
      isPopular: false,
    },
    {
      name: "Pro",
      description: "Managing multiple investment accounts with ease",
      price: "£25",
      period: "/month",
      features: [
        "Up to 5 Accounts",
        "Advanced Analytics",
        "Unlimited Transactions",
        "Priority Support",
      ],
      isPopular: true,
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-card/30 relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
    >
      {/* Geometric divider top */}
      <div className="via-primary/20 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      {/* Top spacing transition */}
      <div className="from-background/50 pointer-events-none absolute top-0 right-0 left-0 h-16 bg-gradient-to-b to-transparent" />

      {/* Background gradient orbs - more subtle for background section */}
      <div className="from-primary/4 absolute top-20 left-1/4 -z-10 h-64 w-64 rounded-full bg-gradient-to-br to-purple-500/3 blur-2xl" />
      <div className="to-primary/4 absolute right-1/4 bottom-20 -z-10 h-48 w-48 rounded-full bg-gradient-to-tl from-purple-500/5 blur-2xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-20 space-y-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Choose Your{" "}
            <span className="from-primary bg-gradient-to-r to-purple-500 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            Start free, upgrade when you need more accounts. Flexible pricing
            that grows with your trading portfolio.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className="group border-border/50 hover:border-border bg-card/60 relative border transition-all duration-300 hover:shadow-lg hover:shadow-gray-400/10"
            >
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    {plan.price}
                    {plan.period && (
                      <span className="text-muted-foreground text-lg font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full ${
                    plan.isPopular
                      ? "from-primary hover:from-primary/90 shadow-primary/25 border-0 bg-gradient-to-r to-purple-500 text-white shadow-lg hover:to-purple-500/90"
                      : ""
                  }`}
                  variant={plan.isPopular ? "default" : "outline"}
                  asChild
                >
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom spacing transition */}
      <div className="from-background/50 pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t to-transparent" />

      {/* Geometric divider bottom */}
      <div className="via-primary/20 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />
    </section>
  );
}
