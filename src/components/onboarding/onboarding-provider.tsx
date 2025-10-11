"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getOnboardingCompletionStatus,
  markOnboardingComplete,
} from "@/app/(auth)/actions";

interface OnboardingContextType {
  showOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
  currentStepIndex: number;
  setCurrentStepIndex: (step: number) => void;
  isOnboardingInProgress: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check database for onboarding completion status
    const checkOnboardingStatus = async () => {
      try {
        const { completed } = await getOnboardingCompletionStatus();

        // Check localStorage for in-progress state (temporary state only)
        const inProgress = localStorage.getItem("optik-onboarding-in-progress");
        const savedStep = localStorage.getItem("optik-onboarding-current-step");

        const wasInProgress = inProgress === "true";

        setHasCompletedOnboarding(completed);
        setIsOnboardingInProgress(wasInProgress);

        if (savedStep && wasInProgress && !completed) {
          setCurrentStepIndex(parseInt(savedStep, 10));
        }

        // Auto-start onboarding for new users (not completed in database)
        if (!completed) {
          // Delay to ensure page is fully loaded
          setTimeout(() => {
            setShowOnboarding(true);
            setIsOnboardingInProgress(true);
            localStorage.setItem("optik-onboarding-in-progress", "true");
          }, 1000);
        }

        // Resume onboarding if it was in progress and not completed
        if (wasInProgress && !completed) {
          setTimeout(() => {
            setShowOnboarding(true);
          }, 500);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Fall back to localStorage if database check fails
        const completed = localStorage.getItem("optik-onboarding-completed");
        setHasCompletedOnboarding(completed === "true");
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
    setIsOnboardingInProgress(true);
    setCurrentStepIndex(0);
    localStorage.setItem("optik-onboarding-in-progress", "true");
    localStorage.setItem("optik-onboarding-current-step", "0");
  };

  const completeOnboarding = async () => {
    try {
      // Mark as completed in database
      const { success } = await markOnboardingComplete();

      if (success) {
        setShowOnboarding(false);
        setHasCompletedOnboarding(true);
        setIsOnboardingInProgress(false);
        setCurrentStepIndex(0);

        // Clean up localStorage
        localStorage.removeItem("optik-onboarding-in-progress");
        localStorage.removeItem("optik-onboarding-current-step");
        // Remove legacy localStorage for migration
        localStorage.removeItem("optik-onboarding-completed");
      } else {
        console.error("Failed to mark onboarding as complete in database");
        // Fall back to localStorage if database update fails
        localStorage.setItem("optik-onboarding-completed", "true");
        localStorage.removeItem("optik-onboarding-in-progress");
        localStorage.removeItem("optik-onboarding-current-step");

        setShowOnboarding(false);
        setHasCompletedOnboarding(true);
        setIsOnboardingInProgress(false);
        setCurrentStepIndex(0);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Fall back to localStorage if database update fails
      localStorage.setItem("optik-onboarding-completed", "true");
      localStorage.removeItem("optik-onboarding-in-progress");
      localStorage.removeItem("optik-onboarding-current-step");

      setShowOnboarding(false);
      setHasCompletedOnboarding(true);
      setIsOnboardingInProgress(false);
      setCurrentStepIndex(0);
    }
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
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}