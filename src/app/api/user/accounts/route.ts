import { getSession, getCurrentAccountKey } from '@/lib/auth/session';
import { getUserAccounts } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getSession();
    const accounts = await getUserAccounts(session.user.id);
    const currentAccountKey = await getCurrentAccountKey();
    
    return NextResponse.json({
      accounts,
      currentAccountKey
    });
}