import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Star } from "lucide-react";

export function Testimonials() {
  const testimonials = [
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
  ];

  return (
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
          {testimonials.map((testimonial, index) => (
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
  );
}