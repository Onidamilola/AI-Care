import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If keys are missing, we can't perform auth checks. 
  // In production (Vercel), this is a critical configuration error.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Supabase environment variables are missing in production!')
    }
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Use getSession to refresh the session if needed
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // 1. If user is NOT logged in and trying to access dashboard or profile
  if (!user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/profile')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If user IS logged in and trying to access signup or login
  if (user && (request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/', '/profile', '/login', '/signup'],
}
