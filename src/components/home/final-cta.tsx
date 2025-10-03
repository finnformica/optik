import NextLink from "next/link";

import DotGrid from "@/components/global/dot-grid";
import { Button } from "@/components/ui/button";
import { paths } from "@/lib/utils";

export function FinalCTA() {
  return (
    <section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 xl:px-32 xl:pb-32">
      <div className="bg-card/20 relative overflow-hidden rounded-2xl px-6 py-24 sm:rounded-3xl sm:p-16 lg:p-24 xl:p-32">
        {/* DotGrid Background */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{
            mask: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            maskComposite: "intersect",
          }}
        >
          <DotGrid
            dotSize={3}
            gap={20}
            baseColor="#1F2937"
            activeColor="#8B5CF6"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        {/* Overlay for content readability */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl" />

        <div className="relative mx-auto max-w-4xl space-y-6 text-center sm:space-y-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            Ready to Trade Smarter?
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
            Join hundreds of options traders getting clarity on their
            performance and taxes.
          </p>
          <div className="pt-2 sm:pt-4">
            <Button
              size="lg"
              asChild
              className="from-primary hover:from-primary/90 bg-gradient-to-r to-purple-500 px-6 py-3 text-base text-white transition-all duration-300 hover:to-purple-500/90 hover:shadow-xl sm:px-8 sm:py-4"
            >
              <NextLink href={paths.auth.signUp}>Start Free Today</NextLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
