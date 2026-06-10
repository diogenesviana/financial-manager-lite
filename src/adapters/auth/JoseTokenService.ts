import { TokenService } from '@/core/domain/ports/TokenService'
import { SignJWT, jwtVerify } from 'jose'

export class JoseTokenService implements TokenService {
  private secret: Uint8Array

  constructor() {
    const secretStr = process.env.JWT_SECRET
    if (!secretStr) {
      throw new Error('[SEGURANÇA] JWT_SECRET não configurado. Defina a variável de ambiente JWT_SECRET antes de iniciar a aplicação.')
    }
    this.secret = new TextEncoder().encode(secretStr)
  }

  async sign(payload: Record<string, any>, expiresIn: string | number): Promise<string> {
    const alg = 'HS256'
    let signJWT = new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
    
    if (typeof expiresIn === 'number') {
      signJWT = signJWT.setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    } else {
      signJWT = signJWT.setExpirationTime(expiresIn)
    }
    
    return signJWT.sign(this.secret)
  }

  async verify(token: string): Promise<Record<string, any> | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret)
      return payload as Record<string, any>
    } catch (error) {
      return null
    }
  }
}
