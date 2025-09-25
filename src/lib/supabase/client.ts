import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function useCurrentAccountKey(): {
  accountKey: number | null;
  refresh: () => Promise<void>;
} {
  const [accountKey, setAccountKey] = useState<number | null>(null);
  const supabase = createClient();

  const getAccountKey = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setAccountKey(user?.user_metadata?.accountKey || null);
  };

  useEffect(() => {
    getAccountKey();
  }, []);

  return {
    accountKey,
    refresh: getAccountKey,
  };
}
