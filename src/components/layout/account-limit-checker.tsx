"use client";

import { useAccountLimitCheck } from "@/api/user";
import { useState, useEffect } from "react";
import { AccountSelectionModal } from "./account-selection-modal";

export function AccountLimitChecker() {
  const { limitCheck, isLoading, error } = useAccountLimitCheck();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isLoading || error || !limitCheck) return;

    // Show modal when user needs to select accounts to keep
    if (limitCheck.needsAccountSelection) {
      setShowModal(true);
    }
  }, [limitCheck, isLoading, error]);

  if (isLoading || error || !limitCheck?.needsAccountSelection) {
    return null;
  }

  return (
    <AccountSelectionModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      limitCheck={limitCheck}
    />
  );
}