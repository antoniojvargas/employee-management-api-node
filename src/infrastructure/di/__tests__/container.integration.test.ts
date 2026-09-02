import 'reflect-metadata';
import { BonusCalculatorFactory } from '../../../application/bonuses/bonus-calculator.factory.js';
import { BonusStrategiesToken } from '../../../application/bonuses/bonus-strategies.token.js';
import { ManagerBonusStrategy } from '../../../application/bonuses/manager-bonus.strategy.js';
import { RegularEmployeeBonusStrategy } from '../../../application/bonuses/regular-employee-bonus.strategy.js';
import { SeniorManagerBonusStrategy } from '../../../application/bonuses/senior-manager-bonus.strategy.js';
import type { IBonusStrategy } from '../../../application/bonuses/bonus-strategy.interface.js';
import { PositionType } from '../../../domain/enums/position-type.enum.js';
import { diContainer, resolveBonusCalculator } from '../container.js';

describe('DI container (integración)', () => {
  it('resolves the bonus calculator factory as an instance of BonusCalculatorFactory', () => {
    const calculator = resolveBonusCalculator();

    expect(calculator).toBeInstanceOf(BonusCalculatorFactory);
  });

  it('registers each bonus strategy exactly once, without duplicates', () => {
    const strategies = diContainer.resolve<IBonusStrategy[]>(BonusStrategiesToken);

    expect(strategies).toHaveLength(3);
    expect(new Set(strategies).size).toBe(strategies.length);

    const positionTypes = strategies.map((strategy) => strategy.positionType);
    expect(new Set(positionTypes).size).toBe(positionTypes.length);
  });

  it('registers every known position type with its concrete strategy', () => {
    const strategies = diContainer.resolve<IBonusStrategy[]>(BonusStrategiesToken);

    const byConstructor: Record<string, PositionType> = {
      RegularEmployeeBonusStrategy: PositionType.Regular,
      ManagerBonusStrategy: PositionType.Manager,
      SeniorManagerBonusStrategy: PositionType.SeniorManager,
    };

    for (const strategy of strategies) {
      const expectedPosition = byConstructor[strategy.constructor.name];
      expect(expectedPosition).toBeDefined();
      expect(strategy.positionType).toBe(expectedPosition);
    }

    expect(strategies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ constructor: RegularEmployeeBonusStrategy }),
        expect.objectContaining({ constructor: ManagerBonusStrategy }),
        expect.objectContaining({ constructor: SeniorManagerBonusStrategy }),
      ]),
    );
  });

  it('resolves a calculator wired to the registered strategies', () => {
    const calculator = resolveBonusCalculator();
    const strategies = diContainer.resolve<IBonusStrategy[]>(BonusStrategiesToken);

    const makeEmployee = (currentPosition: string) => ({
      id: 'emp-1',
      name: 'Ada Lovelace',
      currentPosition,
      salary: 1000,
      departmentId: 'dept-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    for (const strategy of strategies) {
      const positionName = PositionType[strategy.positionType];
      expect(calculator.calculateBonus(makeEmployee(positionName))).toBe(
        strategy.calculateBonus(1000),
      );
    }
  });
});
