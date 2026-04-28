'use client';

import { useAuth } from '../auth/context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusIcon, Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  menuItems: MenuItem[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ menuItems, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-4 gap-2">
          <div className="mb-8 px-4">
            <h2 className="text-xl font-bold tracking-tighter text-indigo-900">MIFTAN</h2>
            <p className="font-manrope text-xs font-medium tracking-tight text-slate-500">Enterprise Analytics</p>
          </div>

          {/* <button className="mb-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold shadow-sm transition-all active:opacity-80 active:scale-98">
            <PlusIcon className="w-4 h-4" />
            <span className="font-manrope text-sm font-medium tracking-tight">MIFTAN Analysis</span>
          </button> */}

          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 font-manrope text-sm font-medium tracking-tight ${
                    isActive
                      ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200/50 pt-4 flex flex-col gap-1">
            {/* <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors duration-200 font-manrope text-sm font-medium tracking-tight"
              onClick={() => setSidebarOpen(false)}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              Settings
            </Link>
            <Link
              href="/support"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors duration-200 font-manrope text-sm font-medium tracking-tight"
              onClick={() => setSidebarOpen(false)}
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
              Support
            </Link> */}

            <div className="flex items-center gap-3 px-4 py-4 mt-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900">{user.full_name || 'User'}</span>
                <span className="text-[10px] text-slate-500">Admin profile</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mt-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}