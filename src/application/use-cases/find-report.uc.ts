import type { MigraineRepository } from '../../domain/ports/migraine-repository.js';
import type { MigraineEntry, MigraineIntensity } from '../../domain/entities/migraine-entry.js';
import type {
  ReportResult,
  FrequencyReport,
  IntensityReport,
  DurationReport,
  TopItemsReport,
  DayIntensityReport,
  MonthlyAverageReport,
} from '../../domain/dtos/report-result.dto.js';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const ALL_INTENSITIES: MigraineIntensity[] = ['low', 'moderate', 'high', 'severe'];

export interface FindReportUcInput {
  userId: string;
  startDate: Date;
  endDate: Date;
}

function buildFrequency(entries: MigraineEntry[]): FrequencyReport {
  const monthMap = new Map<string, number>();

  for (const entry of entries) {
    const key = entry.date.toISOString().slice(0, 7);
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return { total: entries.length, byMonth };
}

function buildIntensity(entries: MigraineEntry[]): IntensityReport {
  const distribution = {
    low: 0,
    moderate: 0,
    high: 0,
    severe: 0,
  };

  for (const entry of entries) {
    distribution[entry.intensity]++;
  }

  return { distribution };
}

function buildDuration(entries: MigraineEntry[]): DurationReport {
  if (entries.length === 0) {
    return { averageMinutes: 0, minMinutes: 0, maxMinutes: 0 };
  }

  const durations = entries.map((e) => e.durationMinutes);
  const total = durations.reduce((sum, d) => sum + d, 0);

  return {
    averageMinutes: Math.round((total / durations.length) * 100) / 100,
    minMinutes: Math.min(...durations),
    maxMinutes: Math.max(...durations),
  };
}

function countOccurrences(items: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  return counts;
}

function buildTopItems(
  entries: MigraineEntry[],
  field: 'triggers' | 'symptoms' | 'treatments',
  limit = 10,
): TopItemsReport {
  const allItems = entries.flatMap((e) => e[field]);
  const counts = countOccurrences(allItems);

  const items = Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

  return { items };
}

function buildDayIntensityDistribution(entries: MigraineEntry[]): DayIntensityReport[] {
  const map = new Map<string, number>();

  for (const entry of entries) {
    const dayName = DAYS_OF_WEEK[entry.date.getDay()];
    const key = `${dayName}:${entry.intensity}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const result: DayIntensityReport[] = [];

  for (const day of DAYS_OF_WEEK) {
    for (const intensity of ALL_INTENSITIES) {
      const key = `${day}:${intensity}`;
      const count = map.get(key) ?? 0;
      if (count > 0) {
        result.push({ dayOfWeek: day, intensity, count });
      }
    }
  }

  return result;
}

function buildMonthlyAverage(entries: MigraineEntry[]): MonthlyAverageReport {
  if (entries.length === 0) {
    return { averagePerMonth: 0, totalMonths: 0 };
  }

  const monthSet = new Set<string>();

  for (const entry of entries) {
    monthSet.add(entry.date.toISOString().slice(0, 7));
  }

  const totalMonths = monthSet.size;

  return {
    averagePerMonth: Math.round((entries.length / totalMonths) * 100) / 100,
    totalMonths,
  };
}

export async function findReportUc(
  repo: MigraineRepository,
  input: FindReportUcInput,
): Promise<ReportResult> {
  const entries = await repo.findEntriesByUser(input.userId, input.startDate, input.endDate);

  return {
    frequency: buildFrequency(entries),
    intensity: buildIntensity(entries),
    duration: buildDuration(entries),
    topTriggers: buildTopItems(entries, 'triggers'),
    topSymptoms: buildTopItems(entries, 'symptoms'),
    topTreatments: buildTopItems(entries, 'treatments'),
    dayIntensityDistribution: buildDayIntensityDistribution(entries),
    monthlyAverage: buildMonthlyAverage(entries),
  };
}
