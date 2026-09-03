import { z } from 'zod';

const nameSchema = z.string().min(1).max(255);

export const departmentDtoSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DepartmentDto = z.infer<typeof departmentDtoSchema>;

export const createDepartmentDtoSchema = z.object({
  name: nameSchema,
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentDtoSchema>;

export const updateDepartmentDtoSchema = z
  .object({
    name: nameSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export type UpdateDepartmentDto = z.infer<typeof updateDepartmentDtoSchema>;
