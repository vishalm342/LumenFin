import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Clerk webhooks
]);

// Define auth routes for redirect logic
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Define API routes that need authentication
const isProtectedApiRoute = createRouteMatcher([
  '/api/chat(.*)',
  '/api/ingest(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Domain validation for production to prevent cookie mismatch errors
  const host = req.headers.get('host');
  const url = new URL(req.url);
  
  // Only run authentication checks on your production domain
  // This prevents cookie domain mismatch issues
  const isProductionDomain = host && (
    host.includes('vercel.app') || 
    host.includes('lumen-fin.vercel.app') ||
    host === 'localhost:3000' // Allow local development
  );

  // Skip middleware for local development or non-production domains
  if (!isProductionDomain && process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // Redirect authenticated users away from auth pages
  if (userId && isAuthRoute(req)) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Protect API routes that require authentication
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Protect all non-public routes
  if (!isPublicRoute(req) && !userId) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - All files with extensions (.html, .css, .js, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
