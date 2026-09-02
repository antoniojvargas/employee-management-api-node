export class BonusStrategyNotFoundError extends Error {
  constructor(position: string) {
    super(`No existe una estrategia de bono registrada para la posición "${position}"`);
    this.name = 'BonusStrategyNotFoundError';
  }
}
