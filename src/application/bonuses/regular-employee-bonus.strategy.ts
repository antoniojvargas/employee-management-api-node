import { injectable } from 'tsyringe';
import { PositionType } from '../../domain/enums/position-type.enum.js';
import type { IBonusStrategy } from './bonus-strategy.interface.js';

@injectable()
export class RegularEmployeeBonusStrategy implements IBonusStrategy {
  readonly positionType = PositionType.Regular;

  calculateBonus(salary: number): number {
    return salary * 0.1;
  }
}
