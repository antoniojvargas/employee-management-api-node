import { InjectionToken } from 'tsyringe';
import type { IBonusStrategy } from './bonus-strategy.interface.js';

export const BonusStrategiesToken: InjectionToken<IBonusStrategy[]> = Symbol('BonusStrategies');
