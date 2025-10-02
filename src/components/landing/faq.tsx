import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
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
    <section className="bg-background relative overflow-hidden py-32 sm:px-6 lg:px-8">
      {/* Background gradient orbs */}
      <div className="from-primary/4 absolute top-20 left-1/4 -z-10 h-64 w-64 rounded-full bg-gradient-to-br to-purple-500/3 blur-2xl" />
      <div className="to-primary/3 absolute right-1/4 bottom-20 -z-10 h-48 w-48 rounded-full bg-gradient-to-tl from-purple-500/5 blur-2xl" />

      <div className="mx-auto max-w-4xl">
        <div className="mb-20 space-y-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            Everything you need to know about Optik. Can't find the answer
            you're looking for? Contact our support team.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-border/50 bg-card/40 hover:border-border data-[state=open]:border-border rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-400/10"
            >
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline [&[data-state=open]>svg]:rotate-180">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="border-border/50 border-t pt-4">
                  <p className="text-muted-foreground leading-relaxed">
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
