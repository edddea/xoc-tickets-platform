import SessionGuard from '@/components/SessionGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <SessionGuard />
      {children}
    </div>
  );
}
