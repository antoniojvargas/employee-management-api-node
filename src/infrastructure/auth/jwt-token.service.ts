import { sign, type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type {
  IJwtTokenService,
  JwtTokenPayload,
} from '../../application/services/token.service.interface.js';

export type { JwtTokenPayload } from '../../application/services/token.service.interface.js';

export class JwtTokenService implements IJwtTokenService {
  async generateToken(
    userId: string,
    email: string,
    roles: JwtTokenPayload['roles'],
  ): Promise<string> {
    const payload: JwtTokenPayload = {
      sub: userId,
      email,
      jti: randomUUID(),
      roles,
    };

    return sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }
}
