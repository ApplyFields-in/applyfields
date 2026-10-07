# Pull Request: Staff Auth, Roles Guard, Users Page, and Eye Toggle

## Branch
`feat/staff-auth` → `main`

## Summary of Changes

### 1. API: Real Staff Authentication & Roles Enforcement
- **`apps/api/src/common/staff.guard.ts`**:
  - Validates JWT tokens from Bearer authorization header or HTTP-only cookies (`accessToken` / `access_token`).
  - Queries `user_roles` directly from PostgreSQL / Prisma. Rejects unassigned users with `403 Forbidden ("You don't have staff access")`.
  - Attaches `req.staff = { id, email, name, roles }`.
- **`apps/api/src/common/roles.decorator.ts`**:
  - Implements role hierarchy: `super_admin` > `admin` > `reviewer` > `content_editor` > `support`.
  - Per-route permission enforcement.
- **`apps/api/src/modules/admin/admin.controller.ts`**:
  - Added `GET /api/v1/admin/me` returning current staff profile and roles.
  - Applied `@Roles('reviewer')` to review queue, save, reject, and publish.
  - Applied `@Roles('admin')` to `/admin/users`.
  - Records audit log entries on staff login (`action: 'staff.login'`).
- **`apps/api/src/modules/admin/users.service.ts`**:
  - Search by name, email, or phone.
  - Cursor/offset pagination.
  - Strips all sensitive credentials (`password_hash`, tokens, MFA secrets).

### 2. Admin App: Login, Protected Routes & Shell
- **`apps/admin/src/app/(auth)/login/page.tsx`**:
  - Full staff login interface with error/success alerts, loading states, and password eye toggle.
  - Wrapped in `<Suspense>` boundary.
- **`apps/admin/src/app/(main)/layout.tsx`**:
  - Calls `GET /admin/me` on initial server render.
  - Automatically redirects 401 unauthenticated requests to `/login`.
  - Shows friendly access denied screen for 403 non-staff accounts.
- **`apps/admin/src/lib/api.ts`**:
  - Automatically forwards client cookies to backend API on server-side calls using `cookies()` from `next/headers`.
- **`apps/admin/src/components/admin-shell.tsx`**:
  - Replaced temporary "Staff log in" button with live staff name, role badge, and Log out action.
- **`apps/admin/src/app/(main)/users/page.tsx`**:
  - Live users list with search, pagination, status badges, verification badges, and joined dates.

### 3. Database Migration
- **`database/changes/2026-10-06_karthik_staff_roles.sql`**:
  - SQL script to assign Likhith (`likhithmanakala@gmail.com`) the initial `super_admin` role in `user_roles`.

### 4. User Experience & Security
- **Password Eye Toggle**:
  - Added interactive show/hide password toggle to Citizen Login (`apps/web`), Citizen Register (`apps/web`), and Staff Login (`apps/admin`).
