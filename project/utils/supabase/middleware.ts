import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    // Get user data
    const user = await supabase.auth.getUser();
    let isAdmin = false;
    
    if (user.data.user) {
        const { data: adminData, error: checkAdminError } = await supabase
            .from("LibraryAdmin")
            .select("admin_id")
            .eq('admin_id', user.data.user.id)
            .single();
        
        if (!checkAdminError && adminData) {
            isAdmin = true;
        }
    }

    //protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    //admin routes
    if (request.nextUrl.pathname.startsWith("/protected/library")) {
        // Check if user is not logged in
        if (user.error) {
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        // Check if user is not admin
        if (!isAdmin) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }
    // if (request.nextUrl.pathname === "/" && !user.error) {
    //   return NextResponse.redirect(new URL("/protected", request.url));
    // }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
