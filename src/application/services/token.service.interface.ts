import type { RoleName } from '../constants/roles.js';

export interface JwtTokenPayload {
  sub: string;
  email: string;
  jti: string;
  roles: RoleName[];
}

export interface IJwtTokenService {
  generateToken(userId: string, email: string, roles: RoleName[]): Promise<string>;
}
