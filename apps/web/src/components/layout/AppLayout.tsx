import { useState } from 'react';
import { ModernSidebar } from './ModernSidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  storageUsed: number;
  storageByType?: {
    video: number;
    document: number;
    photo: number;
    other: number;
  };
}

export function AppLayout({ children, storageUsed, storageByType }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f5fa] flex">
      {/* Modern Sidebar */}
      <ModernSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-20"
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Right Sidebar - Storage Info */}
      <aside className="hidden xl:block w-80 p-6 space-y-6">
        {/* Storage Widget */}
        <StorageWidget 
          used={storageUsed} 
          byType={storageByType}
        />
      </aside>
    </div>
  );
}

interface StorageWidgetProps {
  used: number;
  byType?: {
    video: number;
    document: number;
    photo: number;
    other: number;
  };
}

function StorageWidget(_props: StorageWidgetProps) {
  // Display storage as "unlimited" for Telegram
  const displayStorage = "∞";
  const availableText = "Unlimited";

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Storage</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          View details
        </button>
      </div>

      {/* Donut Chart */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="12"
          />
          {/* Photo segment - Orange */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#fb923c"
            strokeWidth="12"
            strokeDasharray="75 251.2"
            strokeDashoffset="0"
            className="transition-all duration-500"
          />
          {/* Video segment - Cyan */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="12"
            strokeDasharray="50 251.2"
            strokeDashoffset="-75"
            className="transition-all duration-500"
          />
          {/* Document segment - Blue */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="12"
            strokeDasharray="40 251.2"
            strokeDashoffset="-125"
            className="transition-all duration-500"
          />
          {/* Other segment - Light Blue */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#a5b4fc"
            strokeWidth="12"
            strokeDasharray="35 251.2"
            strokeDashoffset="-165"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{displayStorage}</span>
          <span className="text-sm text-gray-500">{availableText}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        <LegendItem color="bg-orange-400" label="Photo" value="∞" />
        <LegendItem color="bg-cyan-400" label="Video" value="∞" />
        <LegendItem color="bg-blue-400" label="Documents" value="∞" />
        <LegendItem color="bg-indigo-300" label="Other" value="∞" />
      </div>

      {/* Unlimited Storage Banner */}
      <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl">
        <p className="text-white text-sm font-medium text-center">
          ♾️ Unlimited Storage via Telegram
        </p>
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", color)} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
