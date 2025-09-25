import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function useCurrentAccountKey(): number | null {
  const [accountKey, setAccountKey] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getAccountKey = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAccountKey(user?.user_metadata?.accountKey || null);
    };

    getAccountKey();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      // Use getUser() instead of session.user for security
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAccountKey(user?.user_metadata?.accountKey || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return accountKey;
}
