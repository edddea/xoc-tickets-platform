import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SessionGuard from '@/components/SessionGuard';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <>
      <SessionGuard />
      {children}
    </>
  );
}
