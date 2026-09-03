import { z } from 'zod';

const nameSchema = z.string().min(1).max(255);

const projectDateSchema = z.coerce.date();

export const projectDtoSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  startDate: projectDateSchema,
  endDate: projectDateSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ProjectDto = z.infer<typeof projectDtoSchema>;

export const createProjectDtoSchema = z.object({
  name: nameSchema,
  startDate: projectDateSchema,
  endDate: projectDateSchema,
});

export type CreateProjectDto = z.infer<typeof createProjectDtoSchema>;

export const updateProjectDtoSchema = z
  .object({
    name: nameSchema,
    startDate: projectDateSchema,
    endDate: projectDateSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export type UpdateProjectDto = z.infer<typeof updateProjectDtoSchema>;
