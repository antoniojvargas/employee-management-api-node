import bcrypt from 'bcrypt';
import { decode, type JwtPayload } from 'jsonwebtoken';
import { Roles, type RoleName } from '../../application/constants/roles.js';
import type { AuthResponseDto, LoginDto, RegisterDto } from '../../application/dtos/auth.dto.js';
import type { UserRepository } from '../../domain/ports/user-repository.js';
import type { IJwtTokenService } from './jwt-token.service.js';

export type AuthErrorCode = 'email_in_use' | 'invalid_credentials' | 'role_not_found';

export type AuthError = { code: AuthErrorCode };

export type AuthResult = { ok: true; data: AuthResponseDto } | { ok: false; error: AuthError };

export interface IAuthService {
  register(input: RegisterDto): Promise<AuthResult>;
  login(input: LoginDto): Promise<AuthResult>;
}

const BCRYPT_ROUNDS = 10;

export class AuthService implements IAuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: IJwtTokenService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      return { ok: false, error: { code: 'email_in_use' } };
    }

    const role = await this.users.findByName(Roles.User);
    if (!role) {
      return { ok: false, error: { code: 'role_not_found' } };
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      roles: [role],
    });

    const token = await this.jwt.generateToken(user.id, user.email, [Roles.User]);
    return { ok: true, data: this.toAuthResponse(token) };
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      return { ok: false, error: { code: 'invalid_credentials' } };
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      return { ok: false, error: { code: 'invalid_credentials' } };
    }

    const roles: RoleName[] = user.roles.map((r) => r.name as RoleName);
    const token = await this.jwt.generateToken(user.id, user.email, roles);
    return { ok: true, data: this.toAuthResponse(token) };
  }

  private toAuthResponse(token: string): AuthResponseDto {
    const decoded = decode(token) as JwtPayload;
    const expiresAt = new Date((decoded?.exp ?? 0) * 1000).toISOString();
    return { token, expiresAt };
  }
}
