import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const faqs = [
    {
      question: "Which brokers do you support?",
      answer:
        "We currently integrate with Charles Schwab directly, with more brokers being added regularly. Direct connections use OAuth authentication—we never store your broker credentials.",
    },
    {
      question: "I'm a US-based trader. Is this still useful for me?",
      answer:
        "Definitely. The core platform—performance tracking, P&L calculations, and position monitoring—works for any options market.",
    },
    {
      question: "How secure is my trading data?",
      answer:
        "We use OAuth connections so we never see or store your broker passwords. All data is hosted on secure servers. We never sell your data, and you can export or delete it anytime.",
    },
    {
      question: "Can I track trades across multiple accounts?",
      answer:
        "Yes, you can monitor different brokers in one place. All with unified reporting and consolidated performance metrics.",
    },
    {
      question: "What happens if I get assigned early or roll a position?",
      answer:
        "Optik handles all the complexity. Early assignments are automatically tracked and P&L is calculated correctly.",
    },
    {
      question: "Do you offer a free trial?",
      answer:
        "Our free plan includes one account and full access to core features—no time limit. You can test drive Optik with real data before deciding whether to upgrade for additional accounts. No credit card required to start.",
    },
  ];

  return (
    <section className="bg-background relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      {/* Background gradient orbs */}
      <div className="from-primary/4 absolute top-20 left-1/4 -z-10 h-64 w-64 rounded-full bg-gradient-to-br to-purple-500/3 blur-2xl" />
      <div className="to-primary/3 absolute right-1/4 bottom-20 -z-10 h-48 w-48 rounded-full bg-gradient-to-tl from-purple-500/5 blur-2xl" />

      <div className="mx-auto max-w-4xl">
        {/* Transitional content */}
        <div className="mb-8 py-8 text-center sm:mb-12 sm:py-12">
          <p className="text-muted-foreground mb-4 text-lg font-medium sm:text-xl">
            Still have questions?
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="to-primary/30 h-px w-12 bg-gradient-to-r from-transparent"></div>
            <ChevronDown className="text-primary/60 h-6 w-6" />
            <div className="to-primary/30 h-px w-12 bg-gradient-to-l from-transparent"></div>
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-border/50 bg-card/40 hover:border-border data-[state=open]:border-border rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-400/10"
            >
              <AccordionTrigger className="px-4 py-4 text-base font-semibold hover:no-underline sm:px-6 sm:text-lg [&[data-state=open]>svg]:rotate-180">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="border-border/50 border-t pt-4">
                  <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                    {faq.answer}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
