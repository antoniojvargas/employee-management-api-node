import type { MigraineEntry } from '../entities/migraine-entry.js';

export interface MigraineRepository {
  findEntriesByUser(userId: string, startDate: Date, endDate: Date): Promise<MigraineEntry[]>;
}
