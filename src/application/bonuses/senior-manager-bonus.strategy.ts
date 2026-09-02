import { PositionType } from '../../domain/enums/position-type.enum.js';
import type { IBonusStrategy } from './bonus-strategy.interface.js';

export class SeniorManagerBonusStrategy implements IBonusStrategy {
  readonly positionType = PositionType.SeniorManager;

  calculateBonus(salary: number): number {
    return salary * 0.25;
  }
}
