export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect Your Broker",
      description: "Link your trading account securely in seconds",
    },
    {
      step: "02",
      title: "Automatic Sync",
      description: "Your positions and transactions sync automatically",
    },
    {
      step: "03",
      title: "Analyse & Optimise",
      description: "View insights and make better trading decisions",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-48 sm:px-6 lg:px-8">
      {/* Top gradient transition */}
      <div className="from-background pointer-events-none absolute top-0 right-0 left-0 h-32 bg-gradient-to-b to-transparent" />

      {/* Background gradient orbs */}
      <div className="to-primary/8 absolute top-40 right-1/3 -z-10 h-48 w-48 rounded-full bg-gradient-to-l from-purple-500/10 blur-2xl" />
      <div className="from-primary/12 absolute bottom-40 left-1/3 -z-10 h-40 w-40 rounded-full bg-gradient-to-r to-purple-500/10 blur-2xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-20 space-y-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            From setup to insights in minutes. Join thousands of traders who've
            simplified their portfolio tracking.
          </p>
        </div>

        <div className="relative grid gap-2 sm:gap-4 md:grid-cols-3 lg:gap-12">
          {/* Stepped connection lines - more diagrammatic */}
          <div className="pointer-events-none absolute top-12 right-0 left-0 hidden md:block">
            {/* Line from step 1 to step 2 */}
            <div className="from-primary/40 to-primary/20 absolute top-0 left-[calc(33.333%-2rem)] h-0.5 w-16 bg-gradient-to-r" />
            <div className="bg-primary/30 absolute top-0 left-[calc(33.333%+2rem)] h-8 w-0.5" />
            <div className="from-primary/30 to-primary/40 absolute top-8 left-[calc(33.333%+2rem)] h-0.5 w-16 bg-gradient-to-r" />

            {/* Line from step 2 to step 3 */}
            <div className="from-primary/40 to-primary/20 absolute top-0 left-[calc(66.666%-2rem)] h-0.5 w-16 bg-gradient-to-r" />
            <div className="bg-primary/30 absolute top-0 left-[calc(66.666%+2rem)] h-8 w-0.5" />
            <div className="from-primary/30 to-primary/40 absolute top-8 left-[calc(66.666%+2rem)] h-0.5 w-16 bg-gradient-to-r" />
          </div>

          {steps.map((step, index) => (
            <div key={index} className="group relative">
              {/* Card background with hover effect */}
              <div className="bg-card/40 border-border/50 hover:bg-card/60 hover:border-primary/30 hover:shadow-primary/10 relative rounded-2xl border p-4 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg lg:p-8">
                {/* Step number with clean minimal styling */}
                <div className="relative mx-auto mb-6">
                  <div className="from-primary shadow-primary/25 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br to-purple-500/90 font-mono text-lg text-white shadow-lg backdrop-blur-sm">
                    {step.step}
                  </div>
                  {/* Glow effect */}
                  <div className="from-primary absolute inset-0 mx-auto h-16 w-16 rounded-full bg-gradient-to-r to-purple-500 opacity-20 blur-xl transition-opacity group-hover:opacity-30" />
                </div>

                <h3 className="mb-4 text-2xl font-bold transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>

                {/* Decorative element */}
                <div className="from-primary absolute top-4 right-4 h-2 w-2 rounded-full bg-gradient-to-r to-purple-500 opacity-30 transition-opacity group-hover:opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t to-transparent" />
    </section>
  );
}
