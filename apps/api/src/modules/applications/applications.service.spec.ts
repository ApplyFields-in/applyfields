import { describe, expect, it } from 'vitest';
import {
  ApplicationsService,
  parseTrackerNotes,
  serializeTrackerNotes,
} from './applications.service.js';

describe('ApplicationsService & Application Tracker Pipeline', () => {
  describe('Notes serialization and parsing', () => {
    it('serializes and parses extra self-tracked fields cleanly', () => {
      const raw = serializeTrackerNotes(
        'Preparation underway for Prelims',
        'ROLL-123456',
        '2026-11-20',
        'St. Joseph Center, Hyderabad',
      );
      expect(raw).toContain('ROLL-123456');

      const parsed = parseTrackerNotes(raw);
      expect(parsed.text).toBe('Preparation underway for Prelims');
      expect(parsed.roll_number).toBe('ROLL-123456');
      expect(parsed.exam_date).toBe('2026-11-20');
      expect(parsed.exam_center).toBe('St. Joseph Center, Hyderabad');
    });

    it('gracefully handles legacy plain text strings', () => {
      const parsed = parseTrackerNotes('Plain old text note');
      expect(parsed.text).toBe('Plain old text note');
      expect(parsed.roll_number).toBeUndefined();
    });
  });

  describe('Application Pipeline Management', () => {
    const mockPrisma = {} as any;
    const service = new ApplicationsService(mockPrisma);
    const userId = '22222222-2222-2222-2222-222222222222';

    it('creates an application tracked item in planning stage', async () => {
      const app = await service.createApplication(userId, {
        opportunity_slug: 'ssc-cgl-2026',
        status: 'planning',
        notes: 'Targeting Tier-1 exam',
      });

      expect(app.id).toBeDefined();
      expect(app.status).toBe('planning');
      expect(app.notes).toBe('Targeting Tier-1 exam');
    });

    it('lists applications and filters by pipeline status', async () => {
      const all = await service.listApplications(userId);
      expect(all.total).toBe(1);

      const planning = await service.listApplications(userId, 'planning');
      expect(planning.total).toBe(1);

      const applied = await service.listApplications(userId, 'applied');
      expect(applied.total).toBe(0);
    });

    it('updates status and records roll number and exam center', async () => {
      const list = await service.listApplications(userId);
      const appId = list.items[0].id;

      const updated = await service.updateApplication(userId, appId, {
        status: 'applied',
        application_number: 'AF-APP-9988',
        roll_number: 'CGL-2026-789',
        exam_date: '2026-12-05',
        exam_center: 'Secunderabad Test Lab',
        notes: 'Fee paid on official portal',
      });

      expect(updated.status).toBe('applied');
      expect(updated.application_number).toBe('AF-APP-9988');
      expect(updated.roll_number).toBe('CGL-2026-789');
      expect(updated.exam_center).toBe('Secunderabad Test Lab');
    });

    it('deletes application from tracker', async () => {
      const list = await service.listApplications(userId);
      const appId = list.items[0].id;

      const res = await service.deleteApplication(userId, appId);
      expect(res.success).toBe(true);

      const remaining = await service.listApplications(userId);
      expect(remaining.total).toBe(0);
    });
  });
});
