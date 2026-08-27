import { z } from 'zod';

export const registerDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterDto = z.infer<typeof registerDtoSchema>;

export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginDtoSchema>;

export const authResponseDtoSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
});

export type AuthResponseDto = z.infer<typeof authResponseDtoSchema>;
