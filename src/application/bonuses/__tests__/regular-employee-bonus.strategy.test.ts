import 'reflect-metadata';
import { RegularEmployeeBonusStrategy } from '../regular-employee-bonus.strategy.js';
import { PositionType } from '../../../domain/enums/position-type.enum.js';

describe('RegularEmployeeBonusStrategy', () => {
  const strategy = new RegularEmployeeBonusStrategy();

  it('exposes the Regular position type', () => {
    expect(strategy.positionType).toBe(PositionType.Regular);
  });

  it('calculates exactly 10% of the salary', () => {
    expect(strategy.calculateBonus(0)).toBe(0);
    expect(strategy.calculateBonus(1000)).toBe(100);
    expect(strategy.calculateBonus(5000)).toBe(500);
    expect(strategy.calculateBonus(12345)).toBeCloseTo(1234.5);
  });

  it('uses floating-point exactness for 10%', () => {
    expect(strategy.calculateBonus(80000)).toBe(8000);
  });
});
