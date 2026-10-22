import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function Home() {
  const destinations:Record<string,string>={super_administrator:'/super-admin/dashboard',cmd_executive:'/cmd/dashboard',head_pharmacist:'/head-pharmacist/dashboard',drf_store_keeper:'/drf-store/dashboard',pharmacy_dispenser:'/pharmacy/dashboard',pharmacy_supervisor:'/pharmacy-supervisor/dashboard',cashier:'/cashier/dashboard',procurement_officer:'/procurement/dashboard',internal_auditor:'/auditor/dashboard',system_administrator:'/system-admin/dashboard'};
  const user=await getSessionUser();
  redirect(user?destinations[user.role_key]||'/403':'/login');
}
