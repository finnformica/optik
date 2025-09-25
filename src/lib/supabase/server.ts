import { paths } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return user;
}

export async function getAuthenticatedUser() {
  const user = await getUser();
  if (!user) {
    redirect(paths.auth.signIn);
  }
  return user;
}

export async function getCurrentAccountKey(): Promise<number> {
  const user = await getAuthenticatedUser();
  const accountKey = user.user_metadata?.accountKey;

  if (!accountKey || typeof accountKey !== "number") {
    throw new Error("No account key found in user metadata");
  }

  return accountKey;
}

export async function updateAccountKey(accountKey: number) {
  const supabase = await createClient();
  // Update user metadata with the new account key
  const { error } = await supabase.auth.updateUser({
    data: { accountKey },
  });

  if (error) {
    throw new Error(`Failed to update account key: ${error.message}`);
  }
}
