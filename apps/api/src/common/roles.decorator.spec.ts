import { hasStaffPermission as can } from './roles.decorator.js';

describe('hasStaffPermission (roles are departments)', () => {
  it('maps the 5 DB roles to departments', () => {
    const content = ['reviewer', 'content_editor'] as const;
    expect(can(['reviewer'], [...content])).toBe(true);
    expect(can(['content_editor'], [...content])).toBe(true);
    expect(can(['support'], [...content])).toBe(false);

    expect(can(['support'], ['support'])).toBe(true);
    expect(can(['reviewer'], ['support'])).toBe(false); // no ladder: reviewers don't see partner KYC
    expect(can(['content_editor'], ['support'])).toBe(false);
  });

  it('admin passes department checks but not super_admin-only ones', () => {
    expect(can(['admin'], ['support'])).toBe(true);
    expect(can(['admin'], ['reviewer', 'content_editor'])).toBe(true);
    expect(can(['admin'], ['admin'])).toBe(true);
    expect(can(['admin'], ['super_admin'])).toBe(false);
    expect(can(['super_admin'], ['super_admin'])).toBe(true);
    expect(can(['reviewer'], ['admin'])).toBe(false);
  });

  it('no staff role, no access', () => {
    expect(can([], undefined)).toBe(false);
    expect(can(['support'], undefined)).toBe(true);
  });
});
