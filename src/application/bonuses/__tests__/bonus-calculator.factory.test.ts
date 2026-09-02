import 'reflect-metadata';
import { BonusCalculatorFactory } from '../bonus-calculator.factory.js';
import { BonusStrategyNotFoundError } from '../bonus-strategy-not-found.error.js';
import type { Employee } from '../../../domain/entities/employee.js';
import { PositionType } from '../../../domain/enums/position-type.enum.js';
import {
  RegularEmployeeBonusStrategy,
  ManagerBonusStrategy,
  SeniorManagerBonusStrategy,
} from '../index.js';
import type { IBonusStrategy } from '../bonus-strategy.interface.js';

interface MockStrategy extends IBonusStrategy {
  calculateBonus: jest.Mock<number>;
}

function mockStrategy(positionType: PositionType): MockStrategy {
  return {
    positionType,
    calculateBonus: jest.fn((salary: number) => salary),
  };
}

function makeEmployee(position: string): Employee {
  return {
    id: 'emp-1',
    name: 'Ada Lovelace',
    currentPosition: position,
    salary: 5000,
    departmentId: 'dept-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function buildFactory(strategies: IBonusStrategy[]): BonusCalculatorFactory {
  return new BonusCalculatorFactory(strategies);
}

describe('BonusCalculatorFactory', () => {
  const realStrategies = [
    new RegularEmployeeBonusStrategy(),
    new ManagerBonusStrategy(),
    new SeniorManagerBonusStrategy(),
  ];

  describe('selección por posición', () => {
    it('delegates to the Regular strategy for Regular positions', () => {
      const factory = buildFactory(realStrategies);
      expect(factory.calculateBonus(makeEmployee('Regular'))).toBe(500);
    });

    it('delegates to the Manager strategy for Manager positions', () => {
      const factory = buildFactory(realStrategies);
      expect(factory.calculateBonus(makeEmployee('Manager'))).toBe(1000);
    });

    it('delegates to the SeniorManager strategy for SeniorManager positions', () => {
      const factory = buildFactory(realStrategies);
      expect(factory.calculateBonus(makeEmployee('SeniorManager'))).toBe(1250);
    });

    it('selects the registered strategy via its positionType', () => {
      const regular = mockStrategy(PositionType.Regular);
      const factory = buildFactory([regular]);

      factory.calculateBonus(makeEmployee('Regular'));

      expect(regular.calculateBonus).toHaveBeenCalledWith(5000);
    });

    it('honors the salary value passed to the delegated strategy', () => {
      const manager = mockStrategy(PositionType.Manager);
      const factory = buildFactory([manager]);

      const employee = makeEmployee('Manager');
      employee.salary = 12345;
      factory.calculateBonus(employee);

      expect(manager.calculateBonus).toHaveBeenCalledWith(12345);
    });
  });

  describe('error controlado si no existe estrategia', () => {
    it('throws BonusStrategyNotFoundError for a position without a registered strategy', () => {
      const factory = buildFactory(realStrategies);

      expect(() => factory.calculateBonus(makeEmployee('CEO'))).toThrow(BonusStrategyNotFoundError);
    });

    it('throws for a position that maps to a PositionType but lacks a strategy', () => {
      const factory = buildFactory([new RegularEmployeeBonusStrategy()]);

      expect(() => factory.calculateBonus(makeEmployee('Manager'))).toThrow(
        BonusStrategyNotFoundError,
      );
    });

    it('includes the position name in the error message', () => {
      const factory = buildFactory(realStrategies);

      expect(() => factory.calculateBonus(makeEmployee('CEO'))).toThrow('"CEO"');
    });
  });
});
