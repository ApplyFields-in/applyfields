import 'reflect-metadata';
import type { StaffRole } from '@applyfields/types';
import { hasStaffPermission, ROLES_KEY } from '../../common/roles.decorator.js';
import { OpportunitiesAdminController } from './opportunities-admin.controller.js';

const publishRoles = (): StaffRole[] =>
  Reflect.getMetadata(ROLES_KEY, OpportunitiesAdminController.prototype.publish) as StaffRole[];

describe('who can publish a reviewed draft', () => {
  it('reviewers can publish (they own the review queue)', () => {
    expect(hasStaffPermission(['reviewer'], publishRoles())).toBe(true);
  });
  it('admins still can', () => {
    expect(hasStaffPermission(['admin'], publishRoles())).toBe(true);
  });
  it('other departments cannot', () => {
    expect(hasStaffPermission(['support'], publishRoles())).toBe(false);
    expect(hasStaffPermission(['content_editor'], publishRoles())).toBe(false);
  });
});
