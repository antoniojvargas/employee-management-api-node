import { sign, type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { RoleName } from '../../application/constants/roles.js';

export interface JwtTokenPayload {
  sub: string;
  email: string;
  jti: string;
  roles: RoleName[];
}

export interface IJwtTokenService {
  generateToken(userId: string, email: string, roles: RoleName[]): Promise<string>;
}

export class JwtTokenService implements IJwtTokenService {
  async generateToken(userId: string, email: string, roles: RoleName[]): Promise<string> {
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
