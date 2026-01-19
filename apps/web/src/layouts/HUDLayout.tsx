import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HUDSidebar } from '@/components/hud/HUDSidebar';
import '@/styles/hud-theme.css';

interface HUDLayoutProps {
    children: React.ReactNode;
}

export function HUDLayout({ children }: HUDLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="hud-theme hud-grid-bg min-h-screen">
            {/* HUD Sidebar */}
            <HUDSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content */}
            <main
                className={cn(
                    "transition-all duration-300 min-h-screen",
                    sidebarCollapsed ? "ml-20" : "ml-64"
                )}
            >
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Ambient glow effect in corner */}
            <div
                className="fixed top-0 right-0 w-96 h-96 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at top right, rgba(0, 255, 255, 0.08) 0%, transparent 60%)',
                }}
            />
            <div
                className="fixed bottom-0 left-64 w-96 h-96 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at bottom left, rgba(0, 212, 255, 0.05) 0%, transparent 60%)',
                }}
            />
        </div>
    );
}
