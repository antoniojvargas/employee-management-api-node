import type { Employee } from '../../domain/entities/employee.js';

export interface IBonusCalculator {
  calculateBonus(employee: Employee): number;
}
