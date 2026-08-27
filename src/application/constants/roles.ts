export const Roles = {
  Admin: 'Admin',
  User: 'User',
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];
