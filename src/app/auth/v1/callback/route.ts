import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paths } from '@/lib/utils'
import { db } from "@/lib/db/config";
import { dimAccount, dimUser, type NewDimUser } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? paths.dashboard
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = paths.dashboard
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Check if user already exists in our database
      const [existingUser] = await db
        .select()
        .from(dimUser)
        .where(eq(dimUser.authUserId, user.id))
        .limit(1);

      if (!existingUser) {
        // Create new user record for OAuth sign-up
        const firstName = user.user_metadata?.given_name || user.user_metadata?.full_name?.split(' ')[0] || 'User';
        const lastName = user.user_metadata?.family_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

        const newUser: NewDimUser = {
          authUserId: user.id,
          firstName,
          lastName,
          email: user.email!,
        };

        const [createdUser] = await db.insert(dimUser).values(newUser).returning();

        if (createdUser) {
          // Create a default account for the new user
          const [createdAccount] = await db
            .insert(dimAccount)
            .values({
              userId: createdUser.id,
              accountName: `${firstName}'s Account`,
              accountType: "INDIVIDUAL",
              currency: "USD",
            })
            .returning();

          // Update user metadata with account key
          await supabase.auth.updateUser({
            data: { accountKey: createdAccount.accountKey },
          });
        }
      } else {
        // Update existing user's metadata with account key if needed
        const [account] = await db
          .select({ accountKey: dimAccount.accountKey })
          .from(dimAccount)
          .where(eq(dimAccount.userId, existingUser.id))
          .limit(1);

        if (account) {
          await supabase.auth.updateUser({
            data: { accountKey: account.accountKey },
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}${paths.auth.signIn}?error=oauth_error`)
}