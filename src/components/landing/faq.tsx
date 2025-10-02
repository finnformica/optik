"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function FAQ() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Which brokers does Optik support?",
      answer:
        "Optik currently supports major UK and US brokers including Interactive Brokers, Trading 212, IG, Charles Schwab, and more. We're constantly adding new broker integrations based on user demand.",
    },
    {
      question: "Is my trading data secure?",
      answer:
        "Yes, we take security very seriously. All data is encrypted in transit and at rest, and we use industry-standard security practices. We never store your broker login credentials - connections are made through secure OAuth protocols.",
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer:
        "Absolutely. You can cancel your Pro subscription at any time from your account settings. You'll continue to have Pro access until the end of your current billing period.",
    },
    {
      question: "When will UK tax features be available?",
      answer:
        "UK tax calculation features are currently in development and will be available in Q2 2025. This will include automatic Capital Gains Tax calculations and Section 104 holding calculations.",
    },
    {
      question: "How accurate are the real-time analytics?",
      answer:
        "Our analytics are updated in real-time as market data changes. We source data from reliable market data providers and synchronize with your broker's position data to ensure accuracy.",
    },
  ];

  return (
    <section className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-border overflow-hidden rounded-lg border"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="hover:bg-card/50 flex w-full items-center justify-between p-6 text-left transition-colors"
              >
                <h3 className="font-semibold">{faq.question}</h3>
                {expandedFaq === index ? (
                  <ChevronDown className="text-muted-foreground h-5 w-5" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-5 w-5" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}