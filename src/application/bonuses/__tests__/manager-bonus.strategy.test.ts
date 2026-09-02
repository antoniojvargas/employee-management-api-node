import 'reflect-metadata';
import { ManagerBonusStrategy } from '../manager-bonus.strategy.js';
import { PositionType } from '../../../domain/enums/position-type.enum.js';

describe('ManagerBonusStrategy', () => {
  const strategy = new ManagerBonusStrategy();

  it('exposes the Manager position type', () => {
    expect(strategy.positionType).toBe(PositionType.Manager);
  });

  it('calculates exactly 20% of the salary', () => {
    expect(strategy.calculateBonus(0)).toBe(0);
    expect(strategy.calculateBonus(1000)).toBe(200);
    expect(strategy.calculateBonus(5000)).toBe(1000);
    expect(strategy.calculateBonus(12345)).toBeCloseTo(2469);
  });

  it('uses floating-point exactness for 20%', () => {
    expect(strategy.calculateBonus(80000)).toBe(16000);
  });
});
