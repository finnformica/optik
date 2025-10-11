"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface OnboardingContextType {
  showOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
  currentStepIndex: number;
  setCurrentStepIndex: (step: number) => void;
  isOnboardingInProgress: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default to true to avoid showing onboarding by default
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOnboardingInProgress, setIsOnboardingInProgress] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem("optik-onboarding-completed");
    const inProgress = localStorage.getItem("optik-onboarding-in-progress");
    const savedStep = localStorage.getItem("optik-onboarding-current-step");

    const hasCompleted = completed === "true";
    const wasInProgress = inProgress === "true";

    setHasCompletedOnboarding(hasCompleted);
    setIsOnboardingInProgress(wasInProgress);

    if (savedStep && wasInProgress) {
      setCurrentStepIndex(parseInt(savedStep, 10));
    }

    // Auto-start onboarding for new users
    if (!hasCompleted) {
      // Delay to ensure page is fully loaded
      setTimeout(() => {
        setShowOnboarding(true);
        setIsOnboardingInProgress(true);
        localStorage.setItem("optik-onboarding-in-progress", "true");
      }, 1000);
    }

    // Resume onboarding if it was in progress
    if (wasInProgress && !hasCompleted) {
      setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
    }
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
    setIsOnboardingInProgress(true);
    setCurrentStepIndex(0);
    localStorage.setItem("optik-onboarding-in-progress", "true");
    localStorage.setItem("optik-onboarding-current-step", "0");
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    setIsOnboardingInProgress(false);
    setCurrentStepIndex(0);
    localStorage.setItem("optik-onboarding-completed", "true");
    localStorage.removeItem("optik-onboarding-in-progress");
    localStorage.removeItem("optik-onboarding-current-step");
  };

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        startOnboarding,
        completeOnboarding,
        hasCompletedOnboarding,
        currentStepIndex,
        setCurrentStepIndex,
        isOnboardingInProgress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}