"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonials = [
    {
      quote:
        "I was losing track of which covered call strategies were actually profitable. Optik showed me I was chasing premium in the wrong stocks. Changed my whole approach.",
      name: "James R.",
      title: "UK Retail Trader",
    },
    {
      quote:
        "The UK tax calculator alone is worth it. I was dreading my self-assessment after trading options all year. Optik generated everything I needed in minutes, and my accountant confirmed the numbers were spot on.",
      name: "Sarah M.",
      title: "London",
    },
    {
      quote:
        "Finally, a platform that understands options traders. The P&L tracking accounts for all the complexity—early assignments, rollovers, multi-leg strategies. This is what Interactive Brokers' reporting should have been.",
      name: "Michael T.",
      title: "Manchester",
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <section className="bg-background relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
      {/* Background gradient orbs */}
      <div className="from-primary/5 absolute top-20 right-1/4 -z-10 h-64 w-64 rounded-full bg-gradient-to-br to-purple-500/3 blur-2xl" />
      <div className="to-primary/3 absolute bottom-20 left-1/4 -z-10 h-48 w-48 rounded-full bg-gradient-to-tl from-purple-500/4 blur-2xl" />

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                What Options Traders Are Saying
              </h2>
              <p className="max-w-lg text-xl leading-relaxed text-gray-400">
                See how Optik is helping traders understand their performance
                and optimise their strategies.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-4">
              <button
                onClick={prevTestimonial}
                className="hover:from-primary hover:shadow-primary/25 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-all duration-200 hover:border-transparent hover:bg-gradient-to-r hover:to-purple-500 hover:text-white hover:shadow-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="hover:from-primary hover:shadow-primary/25 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-all duration-200 hover:border-transparent hover:bg-gradient-to-r hover:to-purple-500 hover:text-white hover:shadow-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right side - Testimonials */}
          <div className="flex flex-col">
            <div className="relative">
              <div className="space-y-4">
                {testimonials.map((testimonial, index) => {
                  const isActive = index === currentIndex;
                  const isNext =
                    index === (currentIndex + 1) % testimonials.length;
                  const isPrev =
                    index ===
                    (currentIndex - 1 + testimonials.length) %
                      testimonials.length;

                  let className = "transition-all duration-500 ";

                  if (isActive) {
                    className +=
                      "opacity-100 scale-100 translate-y-0 z-10 relative";
                  } else if (isNext) {
                    className +=
                      "opacity-40 scale-95 translate-y-4 z-5 absolute top-0 left-0 right-0";
                  } else if (isPrev) {
                    className +=
                      "opacity-20 scale-90 translate-y-8 z-0 absolute top-0 left-0 right-0";
                  } else {
                    className +=
                      "opacity-0 scale-90 translate-y-12 -z-10 absolute top-0 left-0 right-0";
                  }

                  return (
                    <Card
                      key={index}
                      className={`${className} border-gray-800 bg-gray-900/50 backdrop-blur-sm`}
                    >
                      <CardContent className="flex flex-col space-y-4 p-6 sm:space-y-6 sm:p-8">
                        <div className="mb-0 font-serif text-4xl leading-none text-gray-600 sm:text-6xl">
                          "
                        </div>
                        <blockquote className="-mt-2 text-base leading-relaxed text-gray-300 sm:-mt-4 sm:text-lg">
                          {testimonial.quote}
                        </blockquote>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="from-primary/20 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br to-purple-500/20 sm:h-12 sm:w-12">
                            <div className="from-primary h-6 w-6 rounded-full bg-gradient-to-br to-purple-500 sm:h-8 sm:w-8"></div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white sm:text-base">
                              {testimonial.name}
                            </div>
                            <div className="text-xs text-gray-400 sm:text-sm">
                              {testimonial.title}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Status dots */}
            <div className="mt-8 flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "from-primary w-8 bg-gradient-to-r to-purple-500"
                      : "w-2 bg-gray-600 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
