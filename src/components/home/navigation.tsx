"use client";

import { Menu, X } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";

import { Logo } from "@/components/global/logo";
import { Button } from "@/components/ui/button";
import { paths } from "@/lib/utils";

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
              <NextLink href={paths.auth.signUp}>Start Free Today</NextLink>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-accent relative overflow-hidden transition-all duration-200"
            >
              <div className="relative">
                <Menu
                  className={`h-6 w-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? "scale-0 rotate-90 opacity-0"
                      : "scale-100 rotate-0 opacity-100"
                  }`}
                />
                <X
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 -rotate-90 opacity-0"
                  }`}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-muted-foreground hover:text-foreground block py-2 transition-all duration-200 hover:translate-x-1"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-muted-foreground hover:text-foreground block py-2 transition-all duration-200 hover:translate-x-1"
          >
            Pricing
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-muted-foreground hover:text-foreground block py-2 transition-all duration-200 hover:translate-x-1"
          >
            About
          </a>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 mt-4 mb-4 w-full shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <NextLink href={paths.auth.signUp}>Start Free Today</NextLink>
          </Button>
        </div>
      </div>
    </nav>
  );
}
