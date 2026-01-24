import { Link, useLocation } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';

interface CrmLayoutProps {
    children: React.ReactNode;
    storageUsed?: number;
}

export function CrmLayout({ children, storageUsed = 0 }: CrmLayoutProps) {
    const location = useLocation();

    const navItems = [
        { label: 'Contacts', path: '/plugins/crm', icon: Users },
        // Future expansion: Companies, Pipeline, etc.
    ];

    return (
        <AppLayout storageUsed={storageUsed}>
            <div className="flex h-full bg-slate-50">
                {/* CRM Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                    <div className="p-4 border-b border-gray-100">
                        <Link
                            to="/plugins"
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Plugins
                        </Link>
                        <div className="flex items-center gap-2 px-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900">Contacts CRM</span>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === item.path
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <div className="text-xs text-center text-gray-400">
                            Standalone CRM Plugin v1.0
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {children}
                </div>
            </div>
        </AppLayout>
    );
}
