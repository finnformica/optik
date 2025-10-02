"use client";

import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import NextLink from "next/link";

export function Hero() {
  return (
    <section className="relative z-10 overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      {/* Background gradient orbs */}
      <div className="from-primary/20 absolute top-20 left-1/4 h-72 w-72 rounded-full bg-gradient-to-r to-purple-500/20 opacity-40 blur-3xl" />
      <div className="to-primary/15 absolute top-40 right-1/4 h-96 w-96 rounded-full bg-gradient-to-l from-purple-500/15 opacity-30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header Content - Centered */}
        <div className="mb-16 space-y-8 text-center">
          <Badge
            variant="secondary"
            className="mx-auto inline-flex items-center gap-2"
          >
            <Star className="h-4 w-4 text-yellow-500" />
            Trusted by options traders across the UK
          </Badge>

          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl xl:text-7xl">
              Take control of your <br className="hidden sm:block" />
              <span className="from-primary bg-gradient-to-r to-purple-500 bg-clip-text text-transparent">
                Financial Future
              </span>
            </h1>

            <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
              Optik helps you control spending, track income, and manage savings
              with an intuitive financial dashboard.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/90 shadow-primary/25 px-8 shadow-lg"
            >
              <NextLink href="/sign-up">Try It Free</NextLink>
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              View Demo
            </Button>
          </div>
        </div>

        {/* Dashboard Mockup - Full Width Below Header */}
        <div className="relative mx-auto max-w-6xl">
          <DashboardMockup />
          {/* Dark gradient overlay on top of dashboard */}
          <div className="via-background to-background pointer-events-none absolute right-0 bottom-0 left-0 h-96 bg-gradient-to-b from-transparent via-75%" />
        </div>
      </div>
    </section>
  );
}
