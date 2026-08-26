import { findReportUc, type FindReportUcInput } from '../find-report.uc.js';
import type { MigraineRepository } from '../../../domain/ports/migraine-repository.js';
import type { MigraineEntry } from '../../../domain/entities/migraine-entry.js';

function utcDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

function createEntry(overrides: Partial<MigraineEntry> & { date: Date }): MigraineEntry {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    intensity: 'moderate',
    durationMinutes: 60,
    triggers: [],
    symptoms: [],
    treatments: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildMockRepo(entries: MigraineEntry[]): MigraineRepository {
  return {
    findEntriesByUser: async () => entries,
  };
}

function makeInput(overrides: Partial<FindReportUcInput> = {}): FindReportUcInput {
  return {
    userId: 'user-1',
    startDate: utcDate('2026-01-01'),
    endDate: utcDate('2026-12-31'),
    ...overrides,
  };
}

describe('findReportUc', () => {
  describe('with empty dataset', () => {
    it('returns zeroed report when no entries exist', async () => {
      const repo = buildMockRepo([]);
      const result = await findReportUc(repo, makeInput());

      expect(result.frequency.total).toBe(0);
      expect(result.frequency.byMonth).toEqual([]);
      expect(result.intensity.distribution).toEqual({ low: 0, moderate: 0, high: 0, severe: 0 });
      expect(result.duration).toEqual({ averageMinutes: 0, minMinutes: 0, maxMinutes: 0 });
      expect(result.topTriggers.items).toEqual([]);
      expect(result.topSymptoms.items).toEqual([]);
      expect(result.topTreatments.items).toEqual([]);
      expect(result.dayIntensityDistribution).toEqual([]);
      expect(result.monthlyAverage).toEqual({ averagePerMonth: 0, totalMonths: 0 });
    });
  });

  describe('frequency', () => {
    it('counts total entries correctly', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-05') }),
        createEntry({ date: utcDate('2026-01-20') }),
        createEntry({ date: utcDate('2026-02-10') }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.frequency.total).toBe(3);
    });

    it('groups entries by month in ascending order', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-03-15') }),
        createEntry({ date: utcDate('2026-01-10') }),
        createEntry({ date: utcDate('2026-01-25') }),
        createEntry({ date: utcDate('2026-02-05') }),
        createEntry({ date: utcDate('2026-03-20') }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.frequency.byMonth).toEqual([
        { month: '2026-01', count: 2 },
        { month: '2026-02', count: 1 },
        { month: '2026-03', count: 2 },
      ]);
    });
  });

  describe('intensity', () => {
    it('distributes entries across all intensity levels', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-01'), intensity: 'low' }),
        createEntry({ date: utcDate('2026-01-02'), intensity: 'low' }),
        createEntry({ date: utcDate('2026-01-03'), intensity: 'moderate' }),
        createEntry({ date: utcDate('2026-01-04'), intensity: 'high' }),
        createEntry({ date: utcDate('2026-01-05'), intensity: 'high' }),
        createEntry({ date: utcDate('2026-01-06'), intensity: 'high' }),
        createEntry({ date: utcDate('2026-01-07'), intensity: 'severe' }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.intensity.distribution).toEqual({
        low: 2,
        moderate: 1,
        high: 3,
        severe: 1,
      });
    });
  });

  describe('duration', () => {
    it('computes average, min, and max duration', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-01'), durationMinutes: 30 }),
        createEntry({ date: utcDate('2026-01-02'), durationMinutes: 90 }),
        createEntry({ date: utcDate('2026-01-03'), durationMinutes: 60 }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.duration.averageMinutes).toBe(60);
      expect(result.duration.minMinutes).toBe(30);
      expect(result.duration.maxMinutes).toBe(90);
    });

    it('rounds average to 2 decimals', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-01'), durationMinutes: 25 }),
        createEntry({ date: utcDate('2026-01-02'), durationMinutes: 30 }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.duration.averageMinutes).toBe(27.5);
    });
  });

  describe('top triggers', () => {
    it('returns triggers sorted by frequency descending', async () => {
      const entries = [
        createEntry({
          date: utcDate('2026-01-01'),
          triggers: ['stress', 'lack_of_sleep'],
        }),
        createEntry({
          date: utcDate('2026-01-02'),
          triggers: ['stress', 'caffeine'],
        }),
        createEntry({
          date: utcDate('2026-01-03'),
          triggers: ['stress'],
        }),
        createEntry({
          date: utcDate('2026-01-04'),
          triggers: ['weather', 'caffeine'],
        }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.topTriggers.items).toEqual([
        { name: 'stress', count: 3 },
        { name: 'caffeine', count: 2 },
        { name: 'lack_of_sleep', count: 1 },
        { name: 'weather', count: 1 },
      ]);
    });

    it('limits results to top 10 items', async () => {
      const entries = Array.from({ length: 15 }, (_, i) =>
        createEntry({
          date: new Date(`2026-01-${String(i + 1).padStart(2, '0')}`),
          triggers: [`trigger_${i}`],
        }),
      );
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.topTriggers.items).toHaveLength(10);
    });
  });

  describe('top symptoms', () => {
    it('returns symptoms sorted by frequency', async () => {
      const entries = [
        createEntry({
          date: utcDate('2026-01-01'),
          symptoms: ['nausea', 'photophobia'],
        }),
        createEntry({
          date: utcDate('2026-01-02'),
          symptoms: ['nausea', 'aura'],
        }),
        createEntry({
          date: utcDate('2026-01-03'),
          symptoms: ['nausea'],
        }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.topSymptoms.items).toEqual([
        { name: 'nausea', count: 3 },
        { name: 'photophobia', count: 1 },
        { name: 'aura', count: 1 },
      ]);
    });
  });

  describe('top treatments', () => {
    it('returns treatments sorted by frequency', async () => {
      const entries = [
        createEntry({
          date: utcDate('2026-01-01'),
          treatments: ['ibuprofen', 'rest'],
        }),
        createEntry({
          date: utcDate('2026-01-02'),
          treatments: ['ibuprofen'],
        }),
        createEntry({
          date: utcDate('2026-01-03'),
          treatments: ['rest', 'cold_compress'],
        }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.topTreatments.items).toEqual([
        { name: 'ibuprofen', count: 2 },
        { name: 'rest', count: 2 },
        { name: 'cold_compress', count: 1 },
      ]);
    });
  });

  describe('day intensity distribution', () => {
    it('groups entries by day of week and intensity', async () => {
      const entries = [
        // Monday entries
        createEntry({ date: utcDate('2026-01-05'), intensity: 'high' }), // Mon
        createEntry({ date: utcDate('2026-01-12'), intensity: 'high' }), // Mon
        createEntry({ date: utcDate('2026-01-19'), intensity: 'moderate' }), // Mon
        // Wednesday entry
        createEntry({ date: utcDate('2026-01-07'), intensity: 'low' }), // Wed
        // Friday entries
        createEntry({ date: utcDate('2026-01-09'), intensity: 'severe' }), // Fri
        createEntry({ date: utcDate('2026-01-16'), intensity: 'high' }), // Fri
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.dayIntensityDistribution).toEqual([
        { dayOfWeek: 'Monday', intensity: 'moderate', count: 1 },
        { dayOfWeek: 'Monday', intensity: 'high', count: 2 },
        { dayOfWeek: 'Wednesday', intensity: 'low', count: 1 },
        { dayOfWeek: 'Friday', intensity: 'high', count: 1 },
        { dayOfWeek: 'Friday', intensity: 'severe', count: 1 },
      ]);
    });

    it('only includes days that have entries', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-05'), intensity: 'low' }), // Monday only
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.dayIntensityDistribution).toHaveLength(1);
      expect(result.dayIntensityDistribution[0].dayOfWeek).toBe('Monday');
    });
  });

  describe('monthly average', () => {
    it('computes average entries per month', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-01-05') }),
        createEntry({ date: utcDate('2026-01-15') }),
        createEntry({ date: utcDate('2026-01-25') }),
        createEntry({ date: utcDate('2026-02-10') }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.monthlyAverage.averagePerMonth).toBe(2);
      expect(result.monthlyAverage.totalMonths).toBe(2);
    });

    it('handles single month', async () => {
      const entries = [
        createEntry({ date: utcDate('2026-03-01') }),
        createEntry({ date: utcDate('2026-03-10') }),
        createEntry({ date: utcDate('2026-03-20') }),
        createEntry({ date: utcDate('2026-03-28') }),
      ];
      const result = await findReportUc(buildMockRepo(entries), makeInput());

      expect(result.monthlyAverage.averagePerMonth).toBe(4);
      expect(result.monthlyAverage.totalMonths).toBe(1);
    });
  });

  describe('synthetic dataset - realistic scenario', () => {
    it('processes a complex multi-month dataset correctly', async () => {
      const entries = [
        // January: 3 entries
        createEntry({
          date: utcDate('2026-01-03'),
          intensity: 'moderate',
          durationMinutes: 45,
          triggers: ['stress'],
          symptoms: ['nausea'],
          treatments: ['ibuprofen'],
        }),
        createEntry({
          date: utcDate('2026-01-10'),
          intensity: 'severe',
          durationMinutes: 180,
          triggers: ['stress', 'lack_of_sleep'],
          symptoms: ['aura', 'photophobia'],
          treatments: ['rest'],
        }),
        createEntry({
          date: utcDate('2026-01-22'),
          intensity: 'low',
          durationMinutes: 30,
          triggers: ['caffeine'],
          symptoms: ['tension'],
          treatments: ['ibuprofen'],
        }),
        // February: 2 entries
        createEntry({
          date: utcDate('2026-02-05'),
          intensity: 'high',
          durationMinutes: 120,
          triggers: ['weather'],
          symptoms: ['nausea', 'dizziness'],
          treatments: ['cold_compress'],
        }),
        createEntry({
          date: utcDate('2026-02-18'),
          intensity: 'moderate',
          durationMinutes: 60,
          triggers: ['stress'],
          symptoms: ['photophobia'],
          treatments: ['ibuprofen', 'rest'],
        }),
        // March: 1 entry
        createEntry({
          date: utcDate('2026-03-08'),
          intensity: 'high',
          durationMinutes: 90,
          triggers: ['stress', 'caffeine'],
          symptoms: ['nausea'],
          treatments: ['ibuprofen'],
        }),
      ];

      const result = await findReportUc(buildMockRepo(entries), makeInput());

      // Frequency
      expect(result.frequency.total).toBe(6);
      expect(result.frequency.byMonth).toEqual([
        { month: '2026-01', count: 3 },
        { month: '2026-02', count: 2 },
        { month: '2026-03', count: 1 },
      ]);

      // Intensity
      expect(result.intensity.distribution).toEqual({
        low: 1,
        moderate: 2,
        high: 2,
        severe: 1,
      });

      // Duration: avg = (45+180+30+120+60+90)/6 = 525/6 = 87.5
      expect(result.duration.averageMinutes).toBe(87.5);
      expect(result.duration.minMinutes).toBe(30);
      expect(result.duration.maxMinutes).toBe(180);

      // Top triggers
      expect(result.topTriggers.items[0]).toEqual({ name: 'stress', count: 4 });
      expect(result.topTriggers.items[1]).toEqual({ name: 'caffeine', count: 2 });

      // Top symptoms
      expect(result.topSymptoms.items[0]).toEqual({ name: 'nausea', count: 3 });

      // Top treatments
      expect(result.topTreatments.items[0]).toEqual({ name: 'ibuprofen', count: 4 });

      // Monthly average: 6 entries / 3 months = 2
      expect(result.monthlyAverage.averagePerMonth).toBe(2);
      expect(result.monthlyAverage.totalMonths).toBe(3);
    });
  });
});
