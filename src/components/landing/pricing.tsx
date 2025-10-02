import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import NextLink from "next/link";

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
    <section id="pricing" className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Choose Your Plan</h2>
          <p className="text-muted-foreground text-xl">
            Start free, upgrade when you need more accounts
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.isPopular
                  ? "border-primary shadow-primary/20 shadow-lg"
                  : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
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
                      ? "bg-primary hover:bg-primary/90 shadow-primary/25 shadow-lg"
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
    </section>
  );
}
