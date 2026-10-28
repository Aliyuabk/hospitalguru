import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

const roleWorkspace: Record<string, string> = {
  super_administrator: 'super-admin',
  cmd_executive: 'cmd',
  head_pharmacist: 'head-pharmacist',
  drf_store_keeper: 'drf-store',
  pharmacy_dispenser: 'pharmacy',
  pharmacy_supervisor: 'pharmacy-supervisor',
  cashier: 'cashier',
  procurement_officer: 'procurement',
  internal_auditor: 'auditor',
  system_administrator: 'system-admin',
};

export default async function ProfileRoute() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const workspace = roleWorkspace[user.role_key];
  if (!workspace) redirect('/403');
  redirect(`/${workspace}/profile`);
}
