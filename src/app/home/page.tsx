"use client";

import { Logo } from "@/components/global/logo";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { PortfolioMockup } from "@/components/landing/portfolio-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Menu,
  Star,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const toggleFeature = (index: number) => {
    setExpandedFeature(expandedFeature === index ? null : index);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <nav className="bg-background/80 border-border fixed top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Logo size="sm" showText className="text-xl font-bold" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden items-center space-x-8 md:flex">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 shadow-lg"
              >
                <NextLink href="/sign-up">Get Started</NextLink>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="bg-card border-border mt-2 space-y-4 rounded-lg border p-4 md:hidden">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground block transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground block transition-colors"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground block transition-colors"
              >
                About
              </a>
              <Button asChild className="bg-primary hover:bg-primary/90 w-full">
                <NextLink href="/sign-up">Get Started</NextLink>
              </Button>
            </div>
          )}
        </div>
      </nav>

      <Hero />
      <Features />

      {/* How It Works Section */}
      <section className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect Your Broker",
                description: "Link your trading account securely in seconds",
              },
              {
                step: "02",
                title: "Automatic Sync",
                description:
                  "Your positions and transactions sync automatically",
              },
              {
                step: "03",
                title: "Analyse & Optimise",
                description: "View insights and make better trading decisions",
              },
            ].map((step, index) => (
              <div key={index} className="relative space-y-4 text-center">
                <div className="from-primary text-primary-foreground mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r to-purple-500 text-lg font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  A Smarter Way to Track Your Options Portfolio
                </h2>
                <p className="text-muted-foreground text-xl">
                  Built for traders who demand clarity and precision. Optik
                  provides comprehensive analytics and intuitive portfolio
                  management.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Real-Time Analytics",
                    description:
                      "Live updates of your positions, P&L, and portfolio metrics",
                  },
                  {
                    title: "Position Breakdown",
                    description:
                      "Understand every trade with detailed options analysis and Greeks",
                  },
                  {
                    title: "Performance Tracking",
                    description:
                      "Monitor your returns across different strategies and timeframes",
                  },
                  {
                    title: "Multi-Account Management",
                    description:
                      "Track all your trading accounts in one unified dashboard",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="border-border overflow-hidden rounded-lg border"
                  >
                    <button
                      onClick={() => toggleFeature(index)}
                      className="hover:bg-card/50 flex w-full items-center justify-between p-4 text-left transition-colors"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold">{feature.title}</h4>
                        {expandedFeature === index && (
                          <p className="text-muted-foreground text-sm">
                            {feature.description}
                          </p>
                        )}
                      </div>
                      {expandedFeature === index ? (
                        <ChevronDown className="text-muted-foreground h-5 w-5" />
                      ) : (
                        <ChevronRight className="text-muted-foreground h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <PortfolioMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Choose Your Plan</h2>
            <p className="text-muted-foreground text-xl">
              Start free, upgrade when you need more accounts
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>
                  Helping track your investment journey
                </CardDescription>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">Free</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    "1 Account",
                    "Advanced Analytics",
                    "Unlimited Transactions",
                    "Email Support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary shadow-primary/20 relative shadow-lg">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="space-y-4 text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>
                  Managing multiple investment accounts with ease
                </CardDescription>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    £25
                    <span className="text-muted-foreground text-lg font-normal">
                      /month
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    "Up to 5 Accounts",
                    "Advanced Analytics",
                    "Unlimited Transactions",
                    "Priority Support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 shadow-primary/25 w-full shadow-lg"
                  asChild
                >
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Loved by Traders Nationwide
            </h2>
            <p className="text-muted-foreground text-xl">
              See why options traders choose Optik for their portfolio tracking
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "Optik has completely transformed how I track my options strategies. The real-time analytics are invaluable, and the broker integration saves me hours every week.",
                name: "James Mitchell",
                title: "Options Trader, London",
              },
              {
                quote:
                  "Finally, a portfolio tracker that actually understands options trading. The position analysis and historical performance tracking are exactly what I needed.",
                name: "Sarah Chen",
                title: "Retail Investor, Manchester",
              },
              {
                quote:
                  "The multi-account feature is brilliant. I can track all my portfolios in one place with beautiful, easy-to-understand visualisations. Well worth the £25/month.",
                name: "David Thompson",
                title: "Active Trader, Edinburgh",
              },
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-500 text-yellow-500"
                        />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {testimonial.title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Which brokers does Optik support?",
                answer:
                  "Optik currently supports major UK and US brokers including Interactive Brokers, Trading 212, IG, Charles Schwab, and more. We're constantly adding new broker integrations based on user demand.",
              },
              {
                question: "Is my trading data secure?",
                answer:
                  "Yes, we take security very seriously. All data is encrypted in transit and at rest, and we use industry-standard security practices. We never store your broker login credentials - connections are made through secure OAuth protocols.",
              },
              {
                question: "Can I cancel my Pro subscription anytime?",
                answer:
                  "Absolutely. You can cancel your Pro subscription at any time from your account settings. You'll continue to have Pro access until the end of your current billing period.",
              },
              {
                question: "When will UK tax features be available?",
                answer:
                  "UK tax calculation features are currently in development and will be available in Q2 2025. This will include automatic Capital Gains Tax calculations and Section 104 holding calculations.",
              },
              {
                question: "How accurate are the real-time analytics?",
                answer:
                  "Our analytics are updated in real-time as market data changes. We source data from reliable market data providers and synchronize with your broker's position data to ensure accuracy.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="border-border overflow-hidden rounded-lg border"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="hover:bg-card/50 flex w-full items-center justify-between p-6 text-left transition-colors"
                >
                  <h3 className="font-semibold">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronDown className="text-muted-foreground h-5 w-5" />
                  ) : (
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        {/* Background gradient orb */}
        <div className="to-primary/20 absolute right-1/2 bottom-0 h-96 w-96 translate-x-1/2 transform rounded-full bg-gradient-to-r from-purple-500/20 opacity-50 blur-3xl" />

        <div className="relative mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Take Control of Your Options Trading Today
          </h2>
          <p className="text-muted-foreground text-xl">
            Join hundreds of traders who trust Optik for smarter portfolio
            tracking
          </p>
          <div className="space-y-4">
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/90 shadow-primary/25 shadow-lg"
            >
              <NextLink href="/sign-up">Get Started Free</NextLink>
            </Button>
            <p className="text-muted-foreground text-sm">
              No credit card required • Free tier available forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border bg-card/50 border-t">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <Logo size="sm" showText className="text-xl font-bold" />
              <p className="text-muted-foreground">
                Track smarter, trade better
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  About
                </a>
                <a
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="/help"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Help Centre
                </a>
                <a
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>

          <div className="border-border text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
            © 2025 Optik. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
