import 'reflect-metadata';
import { container, type DependencyContainer } from 'tsyringe';
import { BonusCalculatorFactory } from '../../application/bonuses/bonus-calculator.factory.js';
import { BonusStrategiesToken } from '../../application/bonuses/bonus-strategies.token.js';
import { ManagerBonusStrategy } from '../../application/bonuses/manager-bonus.strategy.js';
import { RegularEmployeeBonusStrategy } from '../../application/bonuses/regular-employee-bonus.strategy.js';
import { SeniorManagerBonusStrategy } from '../../application/bonuses/senior-manager-bonus.strategy.js';
import type { IBonusStrategy } from '../../application/bonuses/bonus-strategy.interface.js';

function registerBonusStrategies(deps: DependencyContainer): void {
  const strategies: IBonusStrategy[] = [
    new RegularEmployeeBonusStrategy(),
    new ManagerBonusStrategy(),
    new SeniorManagerBonusStrategy(),
  ];

  deps.register(BonusStrategiesToken, { useValue: strategies });
  deps.register(BonusCalculatorFactory, BonusCalculatorFactory);
}

export const diContainer = container;

registerBonusStrategies(diContainer);

export function resolveBonusCalculator(): BonusCalculatorFactory {
  return diContainer.resolve(BonusCalculatorFactory);
}
