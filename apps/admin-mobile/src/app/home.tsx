/** Phase 2 landing: who is signed in and which departments their roles open. Department screens come next. */
import { useState } from 'react';

import { Badge, Button, Card, Muted, Page, SectionTitle, Title } from '@/components/ui';
import { useSession } from '@/lib/session';
import { DEPARTMENT_LABEL, departmentsForRoles } from '@/lib/staff';
import { C } from '@/theme';

export default function Home() {
  const { staff, reload, logout } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const departments = departmentsForRoles(staff?.roles);

  return (
    <Page
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
      }}
    >
      <Card style={{ padding: 16, gap: 8 }}>
        <Title>{staff?.name || staff?.email || 'Staff member'}</Title>
        {staff?.email ? <Muted>{staff.email}</Muted> : null}
        {(staff?.roles ?? []).map((r) => (
          <Badge key={r} label={r.replace('_', ' ')} color={C.blue} />
        ))}
      </Card>

      <SectionTitle>Your departments</SectionTitle>
      <Card style={{ padding: 16, gap: 8 }}>
        {departments.length ? (
          departments.map((d) => <Title key={d}>{DEPARTMENT_LABEL[d]}</Title>)
        ) : (
          <Muted>Your roles don’t open any department yet.</Muted>
        )}
      </Card>

      <Button label="Sign out" variant="secondary" icon="log-out-outline" onPress={() => void logout()} />
    </Page>
  );
}
