import type { z } from 'zod';
import {
  createProjectDtoSchema,
  projectDtoSchema,
  updateProjectDtoSchema,
} from '../project.dto.js';

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

describe('projectDtoSchema', () => {
  const validProject = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'API Platform',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  it('acepta un proyecto válido', () => {
    expectValid(projectDtoSchema, validProject);
  });

  it('rechaza un id que no es UUID', () => {
    expectInvalid(projectDtoSchema, { ...validProject, id: 'nope' }, ['id']);
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(projectDtoSchema, { ...validProject, name: '' }, ['name']);
  });

  it('rechaza una fecha de inicio inválida', () => {
    expectInvalid(projectDtoSchema, { ...validProject, startDate: 'invalid' }, ['startDate']);
  });

  it('rechaza una fecha de fin inválida', () => {
    expectInvalid(projectDtoSchema, { ...validProject, endDate: 'invalid' }, ['endDate']);
  });
});

describe('createProjectDtoSchema', () => {
  it('acepta un proyecto válido sin tiempos de auditoría', () => {
    expectValid(createProjectDtoSchema, {
      name: 'API Platform',
      startDate: '2026-02-01',
      endDate: '2026-12-31',
    });
  });

  it('rechaza la ausencia de nombre', () => {
    expectInvalid(createProjectDtoSchema, { startDate: '2026-02-01', endDate: '2026-12-31' }, [
      'name',
    ]);
  });

  it('rechaza una fecha de inicio inválida', () => {
    expectInvalid(
      createProjectDtoSchema,
      { name: 'API Platform', startDate: 'invalid', endDate: '2026-12-31' },
      ['startDate'],
    );
  });

  it('rechaza la ausencia de fecha de fin', () => {
    expectInvalid(createProjectDtoSchema, { name: 'API Platform', startDate: '2026-02-01' }, [
      'endDate',
    ]);
  });
});

describe('updateProjectDtoSchema', () => {
  it('acepta un único campo', () => {
    expectValid(updateProjectDtoSchema, { name: 'API Platform v2' });
  });

  it('rechaza un objeto vacío', () => {
    expectMessage(
      updateProjectDtoSchema,
      {},
      'Debe proporcionar al menos un campo para actualizar',
    );
  });

  it('rechaza un valor inválido en startDate', () => {
    expectInvalid(updateProjectDtoSchema, { startDate: 'invalid' }, ['startDate']);
  });
});
