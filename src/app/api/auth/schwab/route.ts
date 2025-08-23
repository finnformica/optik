import { SecureSchwabAuth } from '@/lib/auth/schwab-oauth'
import { getSession } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const schwabAuth = new SecureSchwabAuth()
    const redirectUri = `${process.env.BASE_URL}/api/auth/schwab/callback`
    
    const authUrl = schwabAuth.getAuthorizationUrl(redirectUri)
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Schwab OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Schwab OAuth' }, 
      { status: 500 }
    )
  }
}