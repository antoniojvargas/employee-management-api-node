import type { z } from 'zod';
import { authResponseDtoSchema, loginDtoSchema, registerDtoSchema } from '../auth.dto.js';

function expectValid(schema: z.ZodType<unknown>, input: unknown): void {
  expect(schema.safeParse(input).success).toBe(true);
}

function expectInvalid(
  schema: z.ZodType<unknown>,
  input: unknown,
  path: Array<string | number>,
): void {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.path).toEqual(path);
  }
}

const validCredentials = { email: 'user@example.com', password: 'Password123' };

describe('registerDtoSchema', () => {
  it('acepta credenciales válidas', () => {
    const result = registerDtoSchema.safeParse(validCredentials);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCredentials);
    }
  });

  it('rechaza un email inválido', () => {
    expectInvalid(registerDtoSchema, { email: 'not-an-email', password: 'Password123' }, ['email']);
  });

  it('rechaza un email vacío', () => {
    expectInvalid(registerDtoSchema, { email: '', password: 'Password123' }, ['email']);
  });

  it('rechaza la ausencia de email', () => {
    expectInvalid(registerDtoSchema, { password: 'Password123' }, ['email']);
  });

  it('rechaza una contraseña de menos de 8 caracteres', () => {
    expectInvalid(registerDtoSchema, { email: 'user@example.com', password: '1234567' }, [
      'password',
    ]);
  });

  it('rechaza una contraseña vacía', () => {
    expectInvalid(registerDtoSchema, { email: 'user@example.com', password: '' }, ['password']);
  });

  it('rechaza la ausencia de contraseña', () => {
    expectInvalid(registerDtoSchema, { email: 'user@example.com' }, ['password']);
  });
});

describe('loginDtoSchema', () => {
  it('acepta credenciales válidas', () => {
    expectValid(loginDtoSchema, validCredentials);
  });

  it('rechaza un email inválido', () => {
    expectInvalid(loginDtoSchema, { email: 'not-an-email', password: 'x' }, ['email']);
  });

  it('rechaza una contraseña vacía', () => {
    expectInvalid(loginDtoSchema, { email: 'user@example.com', password: '' }, ['password']);
  });

  it('rechaza la ausencia de contraseña', () => {
    expectInvalid(loginDtoSchema, { email: 'user@example.com' }, ['password']);
  });
});

describe('authResponseDtoSchema', () => {
  const validResponse = { token: 'jwt-token', expiresAt: '2026-01-01T00:00:00.000Z' };

  it('acepta una respuesta válida', () => {
    expectValid(authResponseDtoSchema, validResponse);
  });

  it('rechaza un token que no es string', () => {
    expectInvalid(authResponseDtoSchema, { token: 123, expiresAt: validResponse.expiresAt }, [
      'token',
    ]);
  });

  it('rechaza la ausencia de token', () => {
    expectInvalid(authResponseDtoSchema, { expiresAt: validResponse.expiresAt }, ['token']);
  });

  it('rechaza expiresAt que no es string', () => {
    expectInvalid(authResponseDtoSchema, { token: 'jwt-token', expiresAt: 123 }, ['expiresAt']);
  });
});
