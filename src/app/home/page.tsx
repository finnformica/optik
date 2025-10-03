"use client";

import { FAQ } from "@/components/home/faq";
import { Features } from "@/components/home/features";
import { FinalCTA } from "@/components/home/final-cta";
import { Footer } from "@/components/home/footer";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Navigation } from "@/components/home/navigation";
import { Pricing } from "@/components/home/pricing";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  return (
    <>
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <FAQ />
      <Footer />
    </>
  );
}
