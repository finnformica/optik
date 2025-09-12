import { getSession } from '@/lib/auth/session';
import { getUserAccounts } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const session = await getSession();

    const accounts = await getUserAccounts(session.user.id);
    
    return NextResponse.json(accounts);
  
}