import 'reflect-metadata';
import * as shared from '@applyfields/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { INTERESTS, LOCATION_SCOPES, PERSONAS } from './preferences.options.js';
import { SavePreferencesDto } from './dto/preferences.dto.js';
import { UsersStore } from './users.store.js';

const errorsFor = (body: unknown) => validate(plainToInstance(SavePreferencesDto, body));

it('API copy of the preference option lists matches @applyfields/types', () => {
  expect(PERSONAS).toEqual(shared.PERSONAS);
  expect(INTERESTS).toEqual(shared.INTERESTS);
  expect(LOCATION_SCOPES).toEqual(shared.LOCATION_SCOPES);
});

describe('preferences store', () => {
  it('returns null before setup, then the saved answers with onboarded_at set', async () => {
    const store = new UsersStore();
    expect(await store.getPreferences('u1')).toBeNull();

    const saved = await store.savePreferences('u1', {
      personas: ['job_seeker'],
      interests: ['railways'],
      location_scope: 'state',
      skipped: false,
    });
    expect(saved).toMatchObject({ personas: ['job_seeker'], interests: ['railways'], location_scope: 'state', skipped: false });
    expect(Number.isNaN(Date.parse(saved.onboarded_at ?? ''))).toBe(false);
    expect(await store.getPreferences('u1')).toEqual(saved);
  });

  it('skip with nothing chosen still marks setup done', async () => {
    const store = new UsersStore();
    const saved = await store.savePreferences('u2', { personas: [], interests: [], skipped: true });
    expect(saved.skipped).toBe(true);
    expect(saved.location_scope).toBeNull();
    expect(saved.onboarded_at).not.toBeNull();
  });
});

describe('SavePreferencesDto', () => {
  it('rejects an interest that is not on the list', async () => {
    expect((await errorsFor({ personas: ['job_seeker'], interests: ['cricket'] })).length).toBeGreaterThan(0);
  });
  it('rejects an unknown location scope', async () => {
    expect((await errorsFor({ personas: ['job_seeker'], interests: [], location_scope: 'india' })).length).toBeGreaterThan(0);
  });
  it('rejects an unknown persona', async () => {
    expect((await errorsFor({ personas: ['astronaut'], interests: [] })).length).toBeGreaterThan(0);
  });
  it('accepts a valid body', async () => {
    const body = { personas: ['college_student'], interests: ['scholarships'], location_scope: 'state_central', skipped: false };
    expect(await errorsFor(body)).toHaveLength(0);
  });
});
