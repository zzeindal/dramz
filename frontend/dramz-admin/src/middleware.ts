import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup')
  if (!token && !isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }
  if (token && isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/series'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons|logo|videos|.*\\.svg$).*)']
}


