import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Skip middleware for RSC requests to prevent hanging
    const url = request.nextUrl;
    if (url.searchParams.has('_rsc')) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Add timeout to prevent hanging on slow Supabase calls
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        const authPromise = supabase.auth.getUser();
        
        await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
        console.error('Middleware auth error:', error);
        // Continue without blocking the request
    }

    // Optionally protect routes (uncomment if needed)
    // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - _next/data (Next.js data fetching)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (they handle their own auth)
         */
        '/((?!_next/static|_next/image|_next/data|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
