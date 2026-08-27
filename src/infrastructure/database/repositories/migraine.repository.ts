import { Between, type Repository } from 'typeorm';
import { MigraineEntryEntity } from '../entities/migraine-entry.orm-entity.js';
import type { MigraineRepository } from '../../../domain/ports/migraine-repository.js';
import type { MigraineEntry } from '../../../domain/entities/migraine-entry.js';

export class TypeOrmMigraineRepository implements MigraineRepository {
  constructor(private readonly repo: Repository<MigraineEntryEntity>) {}

  async findEntriesByUser(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MigraineEntry[]> {
    const rows = await this.repo.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date,
      intensity: r.intensity,
      durationMinutes: r.durationMinutes,
      triggers: r.triggers,
      symptoms: r.symptoms,
      treatments: r.treatments,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
