import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Definir caminhos públicos (API e Páginas)
  const isPublicApi = pathname.startsWith('/api/login') || 
                      pathname.startsWith('/api/auth/google') ||
                      pathname.startsWith('/api/logout')

  const isPublicPage = pathname === '/login'

  // Ignorar requisições de arquivos estáticos, _next, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Ler o token dos cookies
  const token = request.cookies.get('auth_token')?.value
  let userPayload: any = null

  if (token && JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      userPayload = payload
    } catch (err) {
      // Token inválido ou expirado, segue como não autenticado
    }
  }

  // 3. Validação de rotas de API
  if (pathname.startsWith('/api')) {
    if (isPublicApi) {
      return NextResponse.next()
    }

    if (!userPayload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Regra de autorização para APIs administrativas
    if (pathname.startsWith('/api/admin') && userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso proibido. Apenas administradores.' }, { status: 403 })
    }

    // Injetar dados do usuário nos cabeçalhos da requisição
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userPayload.id)
    requestHeaders.set('x-user-email', userPayload.email || '')
    requestHeaders.set('x-user-role', userPayload.role || 'USER')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 4. Validação de páginas UI
  if (!userPayload) {
    // Redireciona para /login se tentar acessar página protegida sem estar autenticado
    if (!isPublicPage) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } else {
    // Redireciona para home se já autenticado e tentando acessar o login
    if (isPublicPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Bloqueia acesso à página administrativa para usuários comuns
    if (pathname.startsWith('/admin') && userPayload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Captura todas as rotas de requisições exceto:
     * - Arquivos estáticos em public (images, css, js)
     * - Favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
