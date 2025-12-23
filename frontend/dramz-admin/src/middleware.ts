import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Защита от RCE через Server Actions
  const actionHeader = req.headers.get('next-action')
  if (actionHeader && actionHeader !== 'x' && !actionHeader.match(/^[a-zA-Z0-9_-]+$/)) {
    return new NextResponse('Invalid action', { status: 400 })
  }

  // Блокировка подозрительных запросов
  const userAgent = req.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /curl|wget|powershell|bash|sh\s+-c|nc\s+-e|python\s+-c|perl\s+-e|ruby\s+-e|node\s+-e/i,
    /\.\.\/|\.\.\\|eval\(|exec\(|spawn\(|child_process|system\(|shell_exec/i,
    /javascript:|data:|vbscript:|onerror=|onload=/i,
    /<script|<\/script>|%3Cscript|%3C\/script/i,
  ]
  
  const url = req.url.toLowerCase()
  const pathname = req.nextUrl.pathname.toLowerCase()
  
  // Проверка URL и pathname
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent) || pattern.test(url) || pattern.test(pathname))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Блокировка подозрительных путей
  const dangerousPaths = [
    '/api/',
    '/_next/',
    '/admin/tasks',
  ]
  
  // Проверка query параметров
  const searchParams = req.nextUrl.searchParams.toString().toLowerCase()
  if (suspiciousPatterns.some(pattern => pattern.test(searchParams))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const token = req.cookies.get('admin_token')?.value
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup')
  if (!token && !isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    return NextResponse.redirect(redirectUrl)
  }
  if (token && isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/series'
    return NextResponse.redirect(redirectUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons|logo|videos|.*\\.svg$).*)']
}


