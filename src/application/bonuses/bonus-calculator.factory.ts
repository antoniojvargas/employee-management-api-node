import { inject, injectable } from 'tsyringe';
import type { Employee } from '../../domain/entities/employee.js';
import { PositionType } from '../../domain/enums/position-type.enum.js';
import type { IBonusCalculator } from './bonus-calculator.interface.js';
import { BonusStrategiesToken } from './bonus-strategies.token.js';
import type { IBonusStrategy } from './bonus-strategy.interface.js';

@injectable()
export class BonusCalculatorFactory implements IBonusCalculator {
  private readonly strategiesByPosition: Map<PositionType, IBonusStrategy>;

  constructor(@inject(BonusStrategiesToken) strategies: IBonusStrategy[]) {
    this.strategiesByPosition = new Map(
      strategies.map((strategy) => [strategy.positionType, strategy]),
    );
  }

  calculateBonus(employee: Employee): number {
    const positionType = this.toPositionType(employee.currentPosition);
    const strategy = positionType ? this.strategiesByPosition.get(positionType) : undefined;
    return strategy ? strategy.calculateBonus(employee.salary) : 0;
  }

  private toPositionType(position: string): PositionType | undefined {
    return PositionType[position as keyof typeof PositionType];
  }
}
