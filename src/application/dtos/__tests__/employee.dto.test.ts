import type { z } from 'zod';
import {
  createEmployeeDtoSchema,
  createPositionHistoryDtoSchema,
  employeeDtoSchema,
  positionHistoryDtoSchema,
  updateEmployeeDtoSchema,
} from '../employee.dto.js';

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

const departmentId = '123e4567-e89b-12d3-a456-426614174003';

describe('createEmployeeDtoSchema', () => {
  it('acepta un empleado completo con departamento', () => {
    const result = createEmployeeDtoSchema.safeParse({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId,
    });
    expect(result.success).toBe(true);
  });

  it('acepta un empleado sin departamento', () => {
    expectValid(createEmployeeDtoSchema, {
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
    });
  });

  it('acepta departmentId explícitamente nulo', () => {
    expectValid(createEmployeeDtoSchema, {
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: null,
    });
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(createEmployeeDtoSchema, { name: '', currentPosition: 'Regular', salary: 5000 }, [
      'name',
    ]);
  });

  it('rechaza un nombre de más de 255 caracteres', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'x'.repeat(256), currentPosition: 'Regular', salary: 5000 },
      ['name'],
    );
  });

  it('rechaza la ausencia de nombre', () => {
    expectInvalid(createEmployeeDtoSchema, { currentPosition: 'Regular', salary: 5000 }, ['name']);
  });

  it('rechaza un nombre que no es string', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 123, currentPosition: 'Regular', salary: 5000 },
      ['name'],
    );
  });

  it('rechaza un currentPosition vacío', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: '', salary: 5000 },
      ['currentPosition'],
    );
  });

  it('rechaza la ausencia de currentPosition', () => {
    expectInvalid(createEmployeeDtoSchema, { name: 'Ada Lovelace', salary: 5000 }, [
      'currentPosition',
    ]);
  });

  it('rechaza un salario negativo', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: 'Regular', salary: -1 },
      ['salary'],
    );
  });

  it('rechaza un salario mayor al máximo permitido', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: 'Regular', salary: 100000000 },
      ['salary'],
    );
  });

  it('rechaza un salario con más de 2 decimales', () => {
    expectMessage(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: 'Regular', salary: 1.234 },
      'El salario no puede tener más de 2 decimales',
    );
  });

  it('rechaza un salario que no es number', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: 'Regular', salary: '5000' },
      ['salary'],
    );
  });

  it('rechaza la ausencia de salario', () => {
    expectInvalid(createEmployeeDtoSchema, { name: 'Ada Lovelace', currentPosition: 'Regular' }, [
      'salary',
    ]);
  });

  it('rechaza un departmentId que no es UUID', () => {
    expectInvalid(
      createEmployeeDtoSchema,
      { name: 'Ada Lovelace', currentPosition: 'Regular', salary: 5000, departmentId: 'nope' },
      ['departmentId'],
    );
  });
});

describe('updateEmployeeDtoSchema', () => {
  it('acepta un único campo', () => {
    expectValid(updateEmployeeDtoSchema, { salary: 9000 });
  });

  it('acepta varios campos', () => {
    expectValid(updateEmployeeDtoSchema, { currentPosition: 'Manager', salary: 9000 });
  });

  it('acepta asignar departmentId a null', () => {
    expectValid(updateEmployeeDtoSchema, { departmentId: null });
  });

  it('rechaza un objeto vacío', () => {
    expectMessage(
      updateEmployeeDtoSchema,
      {},
      'Debe proporcionar al menos un campo para actualizar',
    );
  });

  it('rechaza un salario negativo', () => {
    expectInvalid(updateEmployeeDtoSchema, { salary: -5 }, ['salary']);
  });

  it('rechaza un nombre vacío', () => {
    expectInvalid(updateEmployeeDtoSchema, { name: '' }, ['name']);
  });
});

describe('employeeDtoSchema', () => {
  const validEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'Ada Lovelace',
    currentPosition: 'Regular',
    salary: 5000,
    departmentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };

  it('acepta un empleado válido', () => {
    expectValid(employeeDtoSchema, validEmployee);
  });

  it('rechaza un id que no es UUID', () => {
    expectInvalid(employeeDtoSchema, { ...validEmployee, id: 'nope' }, ['id']);
  });

  it('rechaza un departmentId no nulo que no es UUID', () => {
    expectInvalid(employeeDtoSchema, { ...validEmployee, departmentId: 'nope' }, ['departmentId']);
  });

  it('rechaza la ausencia de departmentId', () => {
    expectInvalid(employeeDtoSchema, { ...validEmployee, departmentId: undefined }, [
      'departmentId',
    ]);
  });

  it('rechaza una fecha de creación inválida', () => {
    expectInvalid(employeeDtoSchema, { ...validEmployee, createdAt: 'invalid' }, ['createdAt']);
  });

  it('rechaza la ausencia de updatedAt', () => {
    expectInvalid(employeeDtoSchema, { ...validEmployee, updatedAt: undefined }, ['updatedAt']);
  });
});

describe('positionHistoryDtoSchema', () => {
  const validHistory = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    employeeId: '123e4567-e89b-12d3-a456-426614174006',
    position: 'Junior',
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2022-01-01T00:00:00.000Z',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  };

  it('acepta un historial válido', () => {
    expectValid(positionHistoryDtoSchema, validHistory);
  });

  it('rechaza un id que no es UUID', () => {
    expectInvalid(positionHistoryDtoSchema, { ...validHistory, id: 'nope' }, ['id']);
  });

  it('rechaza un employeeId que no es UUID', () => {
    expectInvalid(positionHistoryDtoSchema, { ...validHistory, employeeId: 'nope' }, [
      'employeeId',
    ]);
  });

  it('rechaza una posición vacía', () => {
    expectInvalid(positionHistoryDtoSchema, { ...validHistory, position: '' }, ['position']);
  });
});

describe('createPositionHistoryDtoSchema', () => {
  it('acepta un historial con startDate anterior a endDate', () => {
    expectValid(createPositionHistoryDtoSchema, {
      position: 'Senior',
      startDate: '2022-01-02',
      endDate: '2026-12-31',
    });
  });

  it('acepta un historial con startDate igual a endDate', () => {
    expectValid(createPositionHistoryDtoSchema, {
      position: 'Senior',
      startDate: '2022-01-02',
      endDate: '2022-01-02',
    });
  });

  it('rechaza un historial con endDate anterior a startDate', () => {
    expectMessage(
      createPositionHistoryDtoSchema,
      { position: 'Senior', startDate: '2026-03-01', endDate: '2026-02-01' },
      'El endDate debe ser mayor o igual al startDate',
    );
  });

  it('rechaza una posición vacía', () => {
    expectInvalid(
      createPositionHistoryDtoSchema,
      {
        position: '',
        startDate: '2022-01-02',
        endDate: '2026-12-31',
      },
      ['position'],
    );
  });

  it('rechaza una fecha de inicio inválida', () => {
    expectInvalid(
      createPositionHistoryDtoSchema,
      {
        position: 'Senior',
        startDate: 'invalid',
        endDate: '2026-12-31',
      },
      ['startDate'],
    );
  });
});
