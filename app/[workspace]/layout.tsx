import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const runtime='nodejs';
const workspaceRoles:Record<string,string>={cmd:'cmd_executive','head-pharmacist':'head_pharmacist','drf-store':'drf_store_keeper',pharmacy:'pharmacy_dispenser','pharmacy-supervisor':'pharmacy_supervisor',cashier:'cashier',procurement:'procurement_officer',auditor:'internal_auditor','system-admin':'system_administrator'};
export default async function WorkspaceLayout({children,params}:{children:ReactNode;params:{workspace:string}}){
  const expected=workspaceRoles[params.workspace]; if(!expected) redirect('/403');
  const user=await getSessionUser(); if(!user) redirect('/login'); if(user.role_key!==expected) redirect('/403');
  return children;
}
