import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('[SEGURANÇA CRÍTICA] JWT_SECRET não configurado. A aplicação não pode funcionar de forma segura sem essa variável de ambiente.')
}
const secret = new TextEncoder().encode(JWT_SECRET || '')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Definir rotas públicas
  const isPublicRoute = 
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/test') ||
    pathname.includes('.') // arquivos estáticos como imagens, favicon, etc.

  const token = request.cookies.get('auth_token')?.value

  // Se for uma rota pública e o usuário estiver logado, redireciona para a home (exceto APIs)
  if (isPublicRoute && token && pathname === '/login') {
    try {
      await jwtVerify(token, secret)
      return NextResponse.redirect(new URL('/', request.url))
    } catch {
      // Token inválido, segue para a página de login
    }
  }

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Se não estiver logado
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar o token
  try {
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string

    // Proteção de rotas do Administrador
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
      if (role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Token inválido ou expirado
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado ou sessão expirada' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    return response
  }
}

// Configurar o matcher para aplicar o middleware em todas as rotas relevantes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
