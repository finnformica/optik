"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useOnboarding } from "./onboarding-provider";

interface OnboardingTourProps {
  shouldShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({
  shouldShow = false,
  onComplete,
}: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentStepIndex,
    setCurrentStepIndex,
    isOnboardingInProgress,
    isLoading,
  } = useOnboarding();

  const steps: Step[] = [
    // Dashboard Overview
    {
      target: "body",
      content: (
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Welcome to Optik Trading! 🎯
          </h2>
          <p>
            Your professional options trading dashboard. Let's take a quick tour
            to get you started.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Navigation</h3>
          <p>
            Use the sidebar to navigate between Dashboard, Transactions, and
            Settings.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-tour="summary-stats"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Portfolio Overview</h3>
          <p>
            Your key portfolio metrics at a glance - total value, P&L, and
            performance indicators.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: '[data-tour="account-menu"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Account Management</h3>
          <p>Manage multiple trading accounts and switch between them here.</p>
        </div>
      ),
      placement: "right",
    },
    // Settings Navigation
    {
      target: '[data-tour="settings-nav"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Let's Connect Your Broker
          </h3>
          <p>
            To get the most out of Optik, let's connect your Schwab account to
            import your portfolio data.
          </p>
        </div>
      ),
      placement: "right",
    },
    // Settings Page - Schwab Connection
    {
      target: '[data-tour="schwab-connection"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Connect Schwab Account</h3>
          <p>
            Connect your Charles Schwab account to automatically import your
            portfolio holdings and track performance.
          </p>
        </div>
      ),
      placement: "top",
    },
    // Transactions Navigation
    {
      target: '[data-tour="transactions-nav"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">View Your Transactions</h3>
          <p>
            Now let's check out the Transactions page where you can sync data
            and view your trading history.
          </p>
        </div>
      ),
      placement: "right",
    },
    // Transactions Page
    {
      target: '[data-tour="sync-button"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Sync Your Data</h3>
          <p>
            After connecting Schwab, use this button to sync your latest
            portfolio data and transactions.
          </p>
        </div>
      ),
      placement: "bottom-start",
    },
    {
      target: '[data-tour="import-dropdown"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">
            Multiple Import Options
          </h3>
          <p>
            You can sync directly from Schwab, import CSV files, or manually
            enter transactions.
          </p>
        </div>
      ),
      placement: "bottom-start",
    },
    {
      target: '[data-tour="transactions-table"]',
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Transaction History</h3>
          <p>
            All your transactions appear here with detailed information
            including symbols, actions, amounts, and fees.
          </p>
        </div>
      ),
      placement: "top",
    },
    // Final Step
    {
      target: "body",
      content: (
        <div>
          <h2 className="mb-2 text-xl font-semibold">You're All Set! 🚀</h2>
          <p className="mb-3">You now know how to:</p>
          <ul className="mx-auto my-6 w-fit list-inside list-disc space-y-1 text-left">
            <li>Navigate the dashboard</li>
            <li>Connect your Schwab account</li>
            <li>Sync and import your trading data</li>
          </ul>
          <p>
            Start by connecting your broker account to unlock the full power of
            Optik Trading!
          </p>
        </div>
      ),
      placement: "center",
    },
  ];

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
        setRun(false);
        onComplete?.();
        return;
      }

      if (type === "step:after") {
        const newStepIndex = index + (action === "prev" ? -1 : 1);
        setCurrentStepIndex(newStepIndex);

        // Save current step to localStorage
        localStorage.setItem(
          "optik-onboarding-current-step",
          newStepIndex.toString(),
        );

        // Handle navigation between pages during the tour
        if (action === "next") {
          // Navigate to settings when reaching step 4 (settings navigation)
          if (index === 4) {
            setRun(false); // Stop the tour temporarily
            router.push("/settings/connections");
            return;
          }
          // Navigate to transactions when reaching step 6 (transactions navigation)
          if (index === 6) {
            setRun(false); // Stop the tour temporarily
            router.push("/transactions");
            return;
          }
        }

        // Handle back navigation
        if (action === "prev") {
          // Go back to dashboard from settings
          if (index === 4 && pathname.includes("/settings")) {
            setRun(false);
            router.push("/dashboard");
            return;
          }
          // Go back to settings from transactions
          if (index === 6 && pathname.includes("/transactions")) {
            setRun(false);
            router.push("/settings/connections");
            return;
          }
        }
      }
    },
    [onComplete, router, pathname, setCurrentStepIndex],
  );

  useEffect(() => {
    if (shouldShow) {
      // Small delay to ensure DOM elements are ready
      setTimeout(() => {
        setRun(true);
      }, 500);
    }
  }, [shouldShow]);

  // Restart tour after navigation if onboarding is in progress
  useEffect(() => {
    if (isOnboardingInProgress && shouldShow) {
      // Add a delay to ensure the new page is rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [pathname, isOnboardingInProgress, shouldShow]);

  // Don't render if we shouldn't show the tour or if still loading
  if (!shouldShow || isLoading) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      stepIndex={currentStepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#2563eb", // Blue-600 to match your theme
          zIndex: 1000,
        },
        tooltip: {
          backgroundColor: "#1f2937", // Gray-800
          color: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #374151", // Gray-700
        },
        tooltipTitle: {
          color: "#ffffff",
        },
        tooltipContent: {
          color: "#d1d5db", // Gray-300
          padding: "12px 0",
        },
        buttonNext: {
          backgroundColor: "#2563eb", // Blue-600
          color: "#ffffff",
          borderRadius: "6px",
          padding: "8px 16px",
          border: "none",
          fontSize: "14px",
          fontWeight: "500",
        },
        buttonBack: {
          color: "#9ca3af", // Gray-400
          marginRight: "8px",
          border: "none",
          backgroundColor: "transparent",
          fontSize: "14px",
        },
        buttonSkip: {
          color: "#9ca3af", // Gray-400
          fontSize: "14px",
          border: "none",
          backgroundColor: "transparent",
        },
        // spotlight: {
        //   backgroundColor: 'transparent',
        // },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
        beacon: {
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}
