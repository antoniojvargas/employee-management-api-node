export type MigraineIntensity = 'low' | 'moderate' | 'high' | 'severe';

export interface MigraineEntry {
  id: string;
  userId: string;
  date: Date;
  intensity: MigraineIntensity;
  durationMinutes: number;
  triggers: string[];
  symptoms: string[];
  treatments: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
