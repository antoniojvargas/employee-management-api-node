import type { z } from 'zod';
import {
  createDepartmentDtoSchema,
  departmentDtoSchema,
  updateDepartmentDtoSchema,
} from '../department.dto.js';

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

function expectMessage(schema: z.ZodType<unknown>, input: unknown, message: string): void {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe(message);
  }
}

describe('departmentDtoSchema', () => {
  const validDepartment = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Engineering',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  it('acepta un departamento válido', () => {
    expectValid(departmentDtoSchema, validDepartment);
  });

  it('rechaza un id que no es UUID', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, id: 'not-a-uuid' }, ['id']);
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, name: '' }, ['name']);
  });

  it('rechaza un nombre de más de 255 caracteres', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, name: 'x'.repeat(256) }, ['name']);
  });

  it('rechaza un nombre que no es string', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, name: 123 }, ['name']);
  });

  it('rechaza una fecha de creación inválida', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, createdAt: 'not-a-date' }, [
      'createdAt',
    ]);
  });

  it('rechaza la ausencia de updatedAt', () => {
    expectInvalid(departmentDtoSchema, { ...validDepartment, updatedAt: undefined }, ['updatedAt']);
  });
});

describe('createDepartmentDtoSchema', () => {
  it('acepta solo el nombre', () => {
    expectValid(createDepartmentDtoSchema, { name: 'Engineering' });
  });

  it('rechaza la ausencia de nombre', () => {
    expectInvalid(createDepartmentDtoSchema, {}, ['name']);
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(createDepartmentDtoSchema, { name: '' }, ['name']);
  });

  it('rechaza un nombre de más de 255 caracteres', () => {
    expectInvalid(createDepartmentDtoSchema, { name: 'x'.repeat(256) }, ['name']);
  });
});

describe('updateDepartmentDtoSchema', () => {
  it('acepta un nombre válido', () => {
    expectValid(updateDepartmentDtoSchema, { name: 'Engineering' });
  });

  it('rechaza un objeto vacío', () => {
    expectMessage(
      updateDepartmentDtoSchema,
      {},
      'Debe proporcionar al menos un campo para actualizar',
    );
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(updateDepartmentDtoSchema, { name: '' }, ['name']);
  });
});
