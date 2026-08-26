import type { MigraineIntensity } from '../entities/migraine-entry.js';

export interface FrequencyReport {
  total: number;
  byMonth: { month: string; count: number }[];
}

export interface IntensityReport {
  distribution: Record<MigraineIntensity, number>;
}

export interface DurationReport {
  averageMinutes: number;
  minMinutes: number;
  maxMinutes: number;
}

export interface TopItemsReport {
  items: { name: string; count: number }[];
}

export interface DayIntensityReport {
  dayOfWeek: string;
  intensity: MigraineIntensity;
  count: number;
}

export interface MonthlyAverageReport {
  averagePerMonth: number;
  totalMonths: number;
}

export interface ReportResult {
  frequency: FrequencyReport;
  intensity: IntensityReport;
  duration: DurationReport;
  topTriggers: TopItemsReport;
  topSymptoms: TopItemsReport;
  topTreatments: TopItemsReport;
  dayIntensityDistribution: DayIntensityReport[];
  monthlyAverage: MonthlyAverageReport;
}
