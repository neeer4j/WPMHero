"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SupabaseContextValue = {
  client: SupabaseClient;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const SupabaseProvider = ({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: Session | null;
}) => {
  const [client] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo(() => ({ client, session }), [client, session]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }

  return context;
};
