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
    <section className="bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 space-y-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Get Started in 3 Simple Steps
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative space-y-4 text-center">
              <div className="from-primary text-primary-foreground mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r to-purple-500 text-lg font-bold">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}