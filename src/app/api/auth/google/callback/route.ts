import { NextResponse } from 'next/server';
import { makeHandleGoogleCallback } from '@/core/factories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('[GOOGLE SSO] Erro retornado pelo Google:', error);
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&details=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error('[GOOGLE SSO] Configurações de credenciais do Google ausentes no servidor.');
    return NextResponse.redirect(new URL('/login?error=server_configuration_error', request.url));
  }

  try {
    // 1. Trocar o código de autorização pelo token de acesso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[GOOGLE SSO] Erro ao obter token do Google:', errBody);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
      console.error('[GOOGLE SSO] Token de acesso não retornado pelo Google.');
      return NextResponse.redirect(new URL('/login?error=invalid_token_response', request.url));
    }

    // 2. Buscar informações do usuário no Google usando o token de acesso
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[GOOGLE SSO] Erro ao buscar informações do usuário no Google.');
      return NextResponse.redirect(new URL('/login?error=user_info_failed', request.url));
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    if (!email) {
      console.error('[GOOGLE SSO] E-mail não fornecido pelo Google.');
      return NextResponse.redirect(new URL('/login?error=email_not_provided', request.url));
    }

    // 3. Executar o caso de uso hexagonal para atualizar o usuário/integrante e gerar o JWT da aplicação
    const handleGoogleCallback = makeHandleGoogleCallback();
    const { token, email: userEmail } = await handleGoogleCallback.execute(email, userInfo.picture || null);

    // 4. Configurar o cookie seguro e redirecionar para a home
    const response = NextResponse.redirect(new URL('/', request.url));
    const expiresIn = 7 * 24 * 60 * 60; // 7 dias
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    console.log(`[GOOGLE SSO] Login realizado com sucesso para o usuário: ${userEmail}`);
    return response;

  } catch (err: any) {
    console.error('[GOOGLE SSO] Erro crítico no fluxo de callback:', err);
    if (err.message === 'unregistered') {
      return NextResponse.redirect(new URL(`/login?error=unregistered`, request.url));
    }
    return NextResponse.redirect(new URL(`/login?error=critical_error&message=${encodeURIComponent(err.message || '')}`, request.url));
  }
}
