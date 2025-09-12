import { SchwabAuth } from '@/lib/connections/schwab/schwab-oauth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const schwabAuth = new SchwabAuth()
    const redirectUri = `${process.env.BASE_URL}/api/auth/schwab/callback`
    
    const authUrl = schwabAuth.getAuthorizationUrl(redirectUri)
    
    return NextResponse.redirect(authUrl)
}