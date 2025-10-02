import { Button } from "@/components/ui/button";
import NextLink from "next/link";

export function FinalCTA() {
  return (
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
  );
}