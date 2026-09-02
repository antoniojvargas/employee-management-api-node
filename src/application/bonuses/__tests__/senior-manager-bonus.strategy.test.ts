import 'reflect-metadata';
import { SeniorManagerBonusStrategy } from '../senior-manager-bonus.strategy.js';
import { PositionType } from '../../../domain/enums/position-type.enum.js';

describe('SeniorManagerBonusStrategy', () => {
  const strategy = new SeniorManagerBonusStrategy();

  it('exposes the SeniorManager position type', () => {
    expect(strategy.positionType).toBe(PositionType.SeniorManager);
  });

  it('calculates exactly 25% of the salary', () => {
    expect(strategy.calculateBonus(0)).toBe(0);
    expect(strategy.calculateBonus(1000)).toBe(250);
    expect(strategy.calculateBonus(5000)).toBe(1250);
    expect(strategy.calculateBonus(12345)).toBeCloseTo(3086.25);
  });

  it('uses floating-point exactness for 25%', () => {
    expect(strategy.calculateBonus(80000)).toBe(20000);
  });
});
