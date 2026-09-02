import { InjectionToken } from 'tsyringe';
import type { IBonusCalculator } from './bonus-calculator.interface.js';

export const BonusCalculatorToken: InjectionToken<IBonusCalculator> = Symbol('BonusCalculator');
