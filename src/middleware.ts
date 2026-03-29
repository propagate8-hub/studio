import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the path the user is trying to visit (e.g., /admin/dashboard)
  const path = request.nextUrl.pathname;

  // 2. We only care about protecting the /admin routes
  const isAdminRoute = path.startsWith('/admin');
  
  // 3. But we MUST leave the actual login page unlocked so people can log in!
  const isLoginPage = path === '/admin/login';

  // 4. Check their pockets for the VIP pass (the secure cookie we made earlier)
  const hasValidSession = request.cookies.has('admin_token');

  // 5. THE BOUNCER LOGIC:
  // If they are trying to enter the admin area, it's NOT the login page, and they have no pass...
  if (isAdminRoute && !isLoginPage && !hasValidSession) {
    // Kick them back to the login screen
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If they DO have the pass, or if they are just visiting the student test area, let them through!
  return NextResponse.next();
}

// 6. Tell Next.js exactly which routes this bouncer should watch (optimizes server speed)
export const config = {
  matcher: ['/admin/:path*'],
};