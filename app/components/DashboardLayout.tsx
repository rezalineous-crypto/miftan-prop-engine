'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/context';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { HomeIcon, BuildingOfficeIcon, CloudArrowUpIcon, DocumentChartBarIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems?: MenuItem[];
}

const defaultMenuItems: MenuItem[] = [
  { href: '/', label: 'Dashboard', description: 'Overview and stats', icon: HomeIcon },
  { href: '/properties', label: 'Properties', description: 'Manage properties', icon: BuildingOfficeIcon },
  { href: '/performance/daily', label: 'Daily Performance', description: 'View daily performance metrics', icon: SparklesIcon },
  { href: '/performance/uploads', label: 'Performance Uploads', description: 'Upload performance data', icon: CloudArrowUpIcon },
  { href: '/reports/diagnosis', label: 'Diagnosis Reports', description: 'View diagnosis reports', icon: DocumentChartBarIcon },
  { href: '/reports/performance', label: 'Performance Reports', description: 'View performance reports', icon: ChartBarIcon },
];

export default function DashboardLayout({ children, menuItems = defaultMenuItems }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar menuItems={menuItems} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Mobile menu button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
          {children}
        </main>

        <footer className="py-6 text-center text-sm text-gray-500 bg-white border-t flex-shrink-0">
          © 2026 MIFTAN Systems. High-performance data analytics.
        </footer>
      </div>
    </div>
  );
}