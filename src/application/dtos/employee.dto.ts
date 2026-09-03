import { z } from 'zod';

const nameSchema = z.string().min(1).max(255);

const salarySchema = z
  .number()
  .min(0)
  .max(99999999.99)
  .refine((value) => Number.isInteger(Math.round(value * 100)), {
    message: 'El salario no puede tener más de 2 decimales',
  });

const positionDateSchema = z.coerce.date();

const employeeIdSchema = z.string().uuid();

export const positionHistoryDtoSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  position: nameSchema,
  startDate: positionDateSchema,
  endDate: positionDateSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PositionHistoryDto = z.infer<typeof positionHistoryDtoSchema>;

export const employeeDtoSchema = z.object({
  id: employeeIdSchema,
  name: nameSchema,
  currentPosition: nameSchema,
  salary: salarySchema,
  departmentId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type EmployeeDto = z.infer<typeof employeeDtoSchema>;

export const createEmployeeDtoSchema = z.object({
  name: nameSchema,
  currentPosition: nameSchema,
  salary: salarySchema,
  departmentId: z.string().uuid().nullish(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeDtoSchema>;

export const updateEmployeeDtoSchema = z
  .object({
    name: nameSchema,
    currentPosition: nameSchema,
    salary: salarySchema,
    departmentId: z.string().uuid().nullish(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export type UpdateEmployeeDto = z.infer<typeof updateEmployeeDtoSchema>;

const departmentDtoSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const projectDtoSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  startDate: positionDateSchema,
  endDate: positionDateSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const employeeWithDepartmentAndProjectsDtoSchema = employeeDtoSchema.extend({
  department: departmentDtoSchema.nullable(),
  projects: z.array(projectDtoSchema),
});

export type EmployeeWithDepartmentAndProjectsDto = z.infer<
  typeof employeeWithDepartmentAndProjectsDtoSchema
>;

export const employeeWithPositionHistoryDtoSchema = employeeDtoSchema.extend({
  positionHistory: z.array(positionHistoryDtoSchema),
});

export type EmployeeWithPositionHistoryDto = z.infer<typeof employeeWithPositionHistoryDtoSchema>;

export const employeeWithBonusDtoSchema = employeeDtoSchema.extend({
  bonus: z.number(),
});

export type EmployeeWithBonusDto = z.infer<typeof employeeWithBonusDtoSchema>;
