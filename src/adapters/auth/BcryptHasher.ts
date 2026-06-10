import { PasswordHasher } from '@/core/domain/ports/PasswordHasher'
import bcrypt from 'bcryptjs'

export class BcryptHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
