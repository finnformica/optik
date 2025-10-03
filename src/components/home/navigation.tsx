"use client";

import { Menu, X } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";

import { Logo } from "@/components/global/logo";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
  );
}
