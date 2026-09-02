import type { PositionType } from '../../domain/enums/position-type.enum.js';

export interface IBonusStrategy {
  positionType: PositionType;
  calculateBonus(salary: number): number;
}
