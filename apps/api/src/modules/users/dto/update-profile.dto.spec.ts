import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateProfileDto } from './update-profile.dto.js';

const ok = (avatar_url: string) =>
  validateSync(plainToInstance(UpdateProfileDto, { avatar_url })).length === 0;

describe('UpdateProfileDto.avatar_url', () => {
  it('accepts pixel avatars, https photos and small uploaded photos', () => {
    expect(ok('pixel-scholar')).toBe(true);
    expect(ok('https://lh3.googleusercontent.com/a/abc')).toBe(true);
    expect(ok(`data:image/jpeg;base64,${'A'.repeat(68_000)}`)).toBe(true); // ~50 KB
  });

  it('rejects photos over 50 KB, other file types and scripts', () => {
    expect(ok(`data:image/png;base64,${'A'.repeat(80_000)}`)).toBe(false);
    expect(ok('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(ok('javascript:alert(1)')).toBe(false);
    expect(ok('http://example.com/a.png')).toBe(false);
  });
});
