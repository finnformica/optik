"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonials = [
    {
      quote:
        "As a business owner, managing finances was overwhelming. Optik's reporting and analytics helped me optimize my spending and grow my profits.",
      name: "David Lee",
      title: "Startup Founder",
    },
    {
      quote:
        "I love how Optik automatically categorizes my expenses. The interface is user-friendly, and it gives me complete control over my finances.",
      name: "Sophia Martinez",
      title: "Marketing Consultant",
    },
    {
      quote:
        "I've tried multiple apps before, but Optik is by far the best. The savings plan and budget tracking features keep me on top of my goals.",
      name: "Michael Johnson",
      title: "Startup Founder",
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
                Real Stories,
                <br />
                Real Results
              </h2>
              <p className="max-w-lg text-xl leading-relaxed text-gray-400">
                See how Optik is transforming the way people manage their
                finances.
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
              <div className="grid gap-6">
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
                    className += "opacity-100 scale-100 translate-y-0 z-10";
                  } else if (isNext) {
                    className += "opacity-40 scale-95 translate-y-4 z-5";
                  } else if (isPrev) {
                    className += "opacity-20 scale-90 translate-y-8 z-0";
                  } else {
                    className += "opacity-0 scale-90 translate-y-12 -z-10";
                  }

                  return (
                    <Card
                      key={index}
                      className={`${className} absolute inset-0 border-gray-800 bg-gray-900/50 backdrop-blur-sm`}
                    >
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          <div className="font-serif text-6xl leading-none text-gray-600">
                            "
                          </div>
                          <blockquote className="-mt-4 text-lg leading-relaxed text-gray-300">
                            {testimonial.quote}
                          </blockquote>
                          <div className="flex items-center gap-4">
                            <div className="from-primary/20 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-purple-500/20">
                              <div className="from-primary h-8 w-8 rounded-full bg-gradient-to-br to-purple-500"></div>
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {testimonial.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {testimonial.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {/* Spacer to maintain height */}
              <div className="h-80"></div>
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
