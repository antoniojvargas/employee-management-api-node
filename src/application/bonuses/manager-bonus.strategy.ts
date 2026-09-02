import { PositionType } from '../../domain/enums/position-type.enum.js';
import type { IBonusStrategy } from './bonus-strategy.interface.js';

export class ManagerBonusStrategy implements IBonusStrategy {
  readonly positionType = PositionType.Manager;

  calculateBonus(salary: number): number {
    return salary * 0.2;
  }
}
