import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HUDSidebar } from '@/components/hud/HUDSidebar';
import '@/styles/hud-theme.css';

interface HUDLayoutProps {
    children: React.ReactNode;
}

// Decorative corner SVG
const HUDCorner = ({ className }: { className?: string }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={cn("absolute opacity-70", className)}>
        <path d="M0 40V0H40V2H2V40H0Z" fill="currentColor" />
        <path d="M10 20V10H20V12H12V20H10Z" fill="currentColor" />
    </svg>
);

export function HUDLayout({ children }: HUDLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="hud-theme hud-grid-bg hud-scanlines min-h-screen flex selection:bg-cyan-500/30 selection:text-cyan-100">
            {/* HUD Sidebar */}
            <HUDSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area Wrapper */}
            <div className={cn(
                "flex-1 flex flex-col relative transition-all duration-300 min-h-screen",
                sidebarCollapsed ? "ml-20" : "ml-64"
            )}>
                {/* Tactical Frame Top Border */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none flex justify-center">
                    <div className="w-1/3 h-1 bg-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
                </div>

                {/* Main Content */}
                <main className="flex-1 relative z-0 p-4 md:p-6 lg:p-10 pt-12 overflow-x-hidden">
                    {/* Inner Frame Definition */}
                    <div className="absolute inset-4 md:inset-6 lg:inset-8 border border-cyan-500/10 pointer-events-none z-[-1]">
                        <HUDCorner className="top-[-2px] left-[-2px] text-cyan-400" />
                        <HUDCorner className="top-[-2px] right-[-2px] text-cyan-400 rotate-90" />
                        <HUDCorner className="bottom-[-2px] right-[-2px] text-cyan-400 rotate-180" />
                        <HUDCorner className="bottom-[-2px] left-[-2px] text-cyan-400 -rotate-90" />

                        {/* Frame Data Labels */}
                        <div className="absolute top-2 left-10 text-[10px] text-cyan-500/50 font-mono tracking-widest">SYS.O1 // DATALINK OK</div>
                        <div className="absolute bottom-2 right-10 text-[10px] text-cyan-500/50 font-mono tracking-widest">SECURE_CHANNEL_ESTABLISHED</div>
                    </div>

                    <div className="relative z-10 w-full h-full">
                        {children}
                    </div>
                </main>

                {/* Ambient glow effect in corners */}
                <div
                    className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0"
                    style={{
                        background: 'radial-gradient(circle at top right, rgba(0, 255, 255, 0.05) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="fixed bottom-0 left-64 w-[600px] h-[600px] pointer-events-none z-0"
                    style={{
                        background: 'radial-gradient(circle at bottom left, rgba(33, 158, 188, 0.03) 0%, transparent 60%)',
                    }}
                />
            </div>
        </div>
    );
}
