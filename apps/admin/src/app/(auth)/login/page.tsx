import { ComingSoon, Logo } from '@applyfields/ui';

export const metadata = { title: 'Staff log in' };

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo subtitle="Internal Portal" />
      <ComingSoon
        title="Staff log in"
        description="Only ApplyFields team members with a staff role can log in — with two-step verification."
        owner="Likhith"
        when="Week 2"
        items={['Email + password', 'Two-step verification (authenticator app)', 'Role check: reviewer, editor, admin…', 'Every login recorded in the audit log']}
      />
    </div>
  );
}
