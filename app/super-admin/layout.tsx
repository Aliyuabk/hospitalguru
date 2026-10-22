import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const runtime='nodejs';
export default async function SuperAdminLayout({children}:{children:ReactNode}){
  const user=await getSessionUser();
  if(!user) redirect('/login');
  if(user.role_key!=='super_administrator') redirect('/403');
  return children;
}
