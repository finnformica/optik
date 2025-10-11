"use client";

import { OnboardingProvider, useOnboarding } from "./onboarding-provider";
import { OnboardingTour } from "./onboarding-tour";

function OnboardingTourWrapper() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <OnboardingTour
      shouldShow={showOnboarding}
      onComplete={completeOnboarding}
    />
  );
}

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingTourWrapper />
    </OnboardingProvider>
  );
}

export { useOnboarding } from "./onboarding-provider";