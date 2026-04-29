'use client';

import DashboardLayout from './components/DashboardLayout';
import {
  ChartBarIcon,
  BellIcon,
  BuildingOffice2Icon,
  DocumentChartBarIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    label: 'Total Properties',
    value: '142',
    change: '+12%',
    sub: 'Active listings',
    icon: BuildingOffice2Icon,
    accent: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    badgeBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    label: 'Avg. Occupancy',
    value: '94.2%',
    change: '+8%',
    sub: 'This month',
    icon: ChartBarIcon,
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Active Alerts',
    value: '12',
    change: '3 new',
    sub: 'Require attention',
    icon: BellIcon,
    accent: 'text-amber-600',
    iconBg: 'bg-amber-50',
    badgeBg: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'System Status',
    value: 'Healthy',
    change: 'Operational',
    sub: 'All systems normal',
    icon: CheckCircleIcon,
    accent: 'text-violet-600',
    iconBg: 'bg-violet-50',
    badgeBg: 'bg-violet-50 text-violet-600',
  },
];

const activity = [
  {
    dot: 'bg-indigo-500',
    title: 'New property added to portfolio',
    time: '2 hours ago',
    icon: BuildingOffice2Icon,
  },
  {
    dot: 'bg-emerald-500',
    title: 'Performance report generated',
    time: '4 hours ago',
    icon: DocumentChartBarIcon,
  },
  {
    dot: 'bg-amber-500',
    title: 'Maintenance alert for Property #127',
    time: '6 hours ago',
    icon: WrenchScrewdriverIcon,
  },
  {
    dot: 'bg-slate-300',
    title: 'Daily upload batch completed',
    time: '8 hours ago',
    icon: CloudArrowUpIcon,
  },
];

const quickActions = [
  {
    label: 'Performance Reports',
    icon: DocumentChartBarIcon,
    href: '/reports/performance',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    border: 'border-indigo-100',
  },
  {
    label: 'Upload Data',
    icon: CloudArrowUpIcon,
    href: '/performance/uploads',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-100',
  },
  {
    label: 'Daily Performance',
    icon: SparklesIcon,
    href: '/performance/daily',
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-100',
  },
  {
    label: 'Diagnosis',
    icon: ChartBarIcon,
    href: '/reports/diagnosis',
    color: 'text-violet-600',
    bg: 'bg-violet-50 hover:bg-violet-100',
    border: 'border-violet-100',
  },
];

export default function Home() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            {today}
          </p>
          <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Here&apos;s what&apos;s happening across your portfolio today.
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-lg transition-colors">
          <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
          Export report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.accent}`} />
              </div>
              <span className={`text-[0.65rem] font-semibold px-2 py-1 rounded-full ${stat.badgeBg}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              {stat.label}
            </p>
            <p className={`text-[1.6rem] font-bold font-headline tracking-tight leading-none ${stat.accent} mb-1`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900 font-headline">Recent Activity</h3>
            <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              View all
              <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-[6px] top-2 bottom-2 w-px bg-slate-100" />
            <div className="space-y-5">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${item.dot} shrink-0 mt-1 ring-2 ring-white relative z-10`}
                  />
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                    </div>
                    <span className="text-[0.7rem] text-slate-400 shrink-0 mt-0.5">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-xs p-6">
          <h3 className="text-sm font-semibold text-slate-900 font-headline mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center justify-center gap-2.5 p-4 border rounded-xl text-center transition-colors ${action.bg} ${action.border}`}
              >
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <span className={`text-[0.7rem] font-semibold ${action.color} leading-tight`}>
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
