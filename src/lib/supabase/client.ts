import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function switchAccount(accountKey: number) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    data: { accountKey }
  })

  if (error) {
    throw error
  }

  // Trigger a page refresh to update server-side data
  window.location.reload()
}

export async function getCurrentAccountKey(): Promise<number | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return user?.user_metadata?.accountKey || null
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

export function useCurrentAccountKey(): number | null {
  const [accountKey, setAccountKey] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getAccountKey = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAccountKey(user?.user_metadata?.accountKey || null)
    }

    getAccountKey()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAccountKey(session?.user?.user_metadata?.accountKey || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return accountKey
}