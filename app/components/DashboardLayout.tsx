'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/context';
import { useRouter } from 'next/navigation';
import Sidebar, { type MenuItem } from './Sidebar';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems?: MenuItem[];
}

const defaultMenuItems: MenuItem[] = [
  { href: '/', label: 'Dashboard', description: 'Overview and stats', icon: HomeIcon, group: 'Main' },
  { href: '/properties', label: 'Properties', description: 'Manage properties', icon: BuildingOfficeIcon, group: 'Main' },
  { href: '/performance/daily', label: 'Daily Performance', description: 'View daily metrics', icon: SparklesIcon, group: 'Performance' },
  { href: '/performance/uploads', label: 'Uploads', description: 'Upload performance data', icon: CloudArrowUpIcon, group: 'Performance' },
  { href: '/monthly_configuration', label: 'Monthly Config', description: 'Configure monthly settings', icon: Cog6ToothIcon, group: 'Configuration' },
  { href: '/reports/diagnosis', label: 'Diagnosis', description: 'View diagnosis reports', icon: DocumentChartBarIcon, group: 'Reports' },
  { href: '/reports/performance', label: 'Performance', description: 'View performance reports', icon: ChartBarIcon, group: 'Reports' },
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar menuItems={menuItems} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="lg:hidden mb-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
              <span className="text-sm font-medium">Menu</span>
            </button>
          </div>
          {children}
        </main>

        <footer className="py-4 text-center text-xs text-gray-400 bg-white border-t border-gray-100 shrink-0">
          © 2026 MIFTAN Systems
        </footer>
      </div>
    </div>
  );
}
