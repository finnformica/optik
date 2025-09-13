"use client";

import { SessionData } from "@/lib/auth/session";
import { createContext, ReactNode, useContext } from "react";

interface SessionContextType {
  session: SessionData;
  refreshSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  session: SessionData;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  const refreshSession = () => {
    // Trigger a page refresh to get fresh session data
    window.location.reload();
  };

  return (
    <SessionContext.Provider value={{ session, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
