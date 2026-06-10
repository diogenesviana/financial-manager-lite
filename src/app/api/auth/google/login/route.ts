import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  if (!clientId || clientId === 'seu-google-client-id.apps.googleusercontent.com') {
    console.error('[GOOGLE SSO] GOOGLE_CLIENT_ID não configurado ou com valor padrão.')
    return NextResponse.json(
      { error: 'Configuração do Google SSO ausente ou inválida.' },
      { status: 500 }
    )
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('prompt', 'select_account')

  return NextResponse.redirect(googleAuthUrl.toString())
}
