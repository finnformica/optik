import { signToken, verifyToken } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { endpoints, paths } from './lib/utils';

const protectedRoutes = paths.dashboard;
const publicApiRoutes = [endpoints.stripe.webhook];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  
  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isApiRoute = pathname.startsWith('/api');
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  const isProtectedApiRoute = isApiRoute && !isPublicApiRoute;
  const isAuthRoute = pathname.startsWith(paths.auth.signIn) || pathname.startsWith(paths.auth.signUp);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL(paths.auth.signIn, request.url));
  }

  if (isProtectedApiRoute && !sessionCookie) {
    return NextResponse.json(
      { error: 'Unauthorised' },
      { status: 401 }
    );
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL(paths.dashboard, request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL(paths.auth.signIn, request.url));
      }
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorised' },
          { status: 401 }
        );
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};
