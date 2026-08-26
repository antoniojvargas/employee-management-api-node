import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { MigraineIntensity } from '../../../domain/entities/migraine-entry.js';

@Entity('migraine_entries')
@Index('idx_migraine_entries_user_id', ['userId'])
@Index('idx_migraine_entries_date', ['date'])
@Index('idx_migraine_entries_user_date', ['userId', 'date'])
export class MigraineEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({ type: 'varchar', length: 20 })
  intensity!: MigraineIntensity;

  @Column({ type: 'integer', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'jsonb', default: '[]' })
  triggers!: string[];

  @Column({ type: 'jsonb', default: '[]' })
  symptoms!: string[];

  @Column({ type: 'jsonb', default: '[]' })
  treatments!: string[];

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
