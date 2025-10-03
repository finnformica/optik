import NextLink from "next/link";

import DotGrid from "@/components/global/dot-grid";
import { Button } from "@/components/ui/button";
import { paths } from "@/lib/utils";

export function FinalCTA() {
  return (
    <section className="px-4 sm:px-8 lg:px-32">
      <div className="bg-card/20 relative overflow-hidden rounded-3xl p-32">
        {/* DotGrid Background */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl"
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
        <div className="absolute inset-0 rounded-3xl" />

        <div className="relative mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to Trade Smarter?
          </h2>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-300">
            Join hundreds of options traders getting clarity on their performance and taxes.
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              asChild
              className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl"
            >
              <NextLink href={paths.auth.signUp}>Start Free Today</NextLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
