"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/global/logo";
import {
  ChevronDown,
  ChevronRight,
  Star,
  CheckCircle,
  Target,
  BarChart3,
  Layers,
  Clock,
  Calculator,
  Link,
  Menu,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { PortfolioMockup } from "@/components/landing/portfolio-mockup";
import { Features } from "@/components/landing/features";

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="sm" showText className="text-xl font-bold" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
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
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-card border border-border rounded-lg mt-2 p-4 space-y-4">
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <NextLink href="/sign-up">Get Started</NextLink>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-gradient-to-l from-purple-500/15 to-primary/15 rounded-full blur-3xl opacity-30" />

        <div className="max-w-7xl mx-auto relative">
          {/* Header Content - Centered */}
          <div className="text-center space-y-8 mb-16">
            <Badge variant="secondary" className="inline-flex items-center gap-2 mx-auto">
              <Star className="h-4 w-4 text-yellow-500" />
              Trusted by options traders across the UK
            </Badge>

            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                Manage Finances{" "}
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                  Easily and Smartly
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Optik helps you control spending, track income, and manage
                savings with an intuitive financial dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 px-8">
                <NextLink href="/sign-up">Try It Free</NextLink>
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                View Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Mockup - Full Width Below Header */}
          <div className="relative max-w-6xl mx-auto">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground mb-8">Integrated with leading brokers</p>
          <div className="flex flex-wrap justify-center items-center gap-4 opacity-60">
            {["Interactive Brokers", "Trading 212", "IG", "Schwab", "Hargreaves Lansdown", "AJ Bell"].map((broker) => (
              <div key={broker} className="text-sm font-medium px-4 py-2 bg-card rounded-lg border border-border">
                {broker}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Get Started in 3 Simple Steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Your Broker",
                description: "Link your trading account securely in seconds"
              },
              {
                step: "02",
                title: "Automatic Sync",
                description: "Your positions and transactions sync automatically"
              },
              {
                step: "03",
                title: "Analyse & Optimise",
                description: "View insights and make better trading decisions"
              }
            ].map((step, index) => (
              <div key={index} className="text-center space-y-4 relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-primary-foreground font-bold text-lg">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">
                  A Smarter Way to Track Your Options Portfolio
                </h2>
                <p className="text-xl text-muted-foreground">
                  Built for traders who demand clarity and precision. Optik provides comprehensive
                  analytics and intuitive portfolio management.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Real-Time Analytics",
                    description: "Live updates of your positions, P&L, and portfolio metrics"
                  },
                  {
                    title: "Position Breakdown",
                    description: "Understand every trade with detailed options analysis and Greeks"
                  },
                  {
                    title: "Performance Tracking",
                    description: "Monitor your returns across different strategies and timeframes"
                  },
                  {
                    title: "Multi-Account Management",
                    description: "Track all your trading accounts in one unified dashboard"
                  }
                ].map((feature, index) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFeature(index)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-card/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold">{feature.title}</h4>
                        {expandedFeature === index && (
                          <p className="text-muted-foreground text-sm">{feature.description}</p>
                        )}
                      </div>
                      {expandedFeature === index ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more accounts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>Helping track your investment journey</CardDescription>
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
                    "Email Support"
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
            <Card className="relative border-primary shadow-lg shadow-primary/20">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>Managing multiple investment accounts with ease</CardDescription>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">£25<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    "Up to 5 Accounts",
                    "Advanced Analytics",
                    "Unlimited Transactions",
                    "Priority Support"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" asChild>
                  <NextLink href="/sign-up">Get Started</NextLink>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Loved by Traders Nationwide</h2>
            <p className="text-xl text-muted-foreground">
              See why options traders choose Optik for their portfolio tracking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Optik has completely transformed how I track my options strategies. The real-time analytics are invaluable, and the broker integration saves me hours every week.",
                name: "James Mitchell",
                title: "Options Trader, London"
              },
              {
                quote: "Finally, a portfolio tracker that actually understands options trading. The position analysis and historical performance tracking are exactly what I needed.",
                name: "Sarah Chen",
                title: "Retail Investor, Manchester"
              },
              {
                quote: "The multi-account feature is brilliant. I can track all my portfolios in one place with beautiful, easy-to-understand visualisations. Well worth the £25/month.",
                name: "David Thompson",
                title: "Active Trader, Edinburgh"
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Which brokers does Optik support?",
                answer: "Optik currently supports major UK and US brokers including Interactive Brokers, Trading 212, IG, Charles Schwab, and more. We're constantly adding new broker integrations based on user demand."
              },
              {
                question: "Is my trading data secure?",
                answer: "Yes, we take security very seriously. All data is encrypted in transit and at rest, and we use industry-standard security practices. We never store your broker login credentials - connections are made through secure OAuth protocols."
              },
              {
                question: "Can I cancel my Pro subscription anytime?",
                answer: "Absolutely. You can cancel your Pro subscription at any time from your account settings. You'll continue to have Pro access until the end of your current billing period."
              },
              {
                question: "When will UK tax features be available?",
                answer: "UK tax calculation features are currently in development and will be available in Q2 2025. This will include automatic Capital Gains Tax calculations and Section 104 holding calculations."
              },
              {
                question: "How accurate are the real-time analytics?",
                answer: "Our analytics are updated in real-time as market data changes. We source data from reliable market data providers and synchronize with your broker's position data to ensure accuracy."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-card/50 transition-colors"
                >
                  <h3 className="font-semibold">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient orb */}
        <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-primary/20 rounded-full blur-3xl opacity-50" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Take Control of Your Options Trading Today
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of traders who trust Optik for smarter portfolio tracking
          </p>
          <div className="space-y-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <NextLink href="/sign-up">Get Started Free</NextLink>
            </Button>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo size="sm" showText className="text-xl font-bold" />
              <p className="text-muted-foreground">
                Track smarter, trade better
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
                <a href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <a href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="/help" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Centre
                </a>
                <a href="/docs" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Optik. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
