import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Wrapper
 * This layout is applied to all pages under /dashboard route
 * Provides consistent sidebar and responsive behavior across dashboard pages
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}