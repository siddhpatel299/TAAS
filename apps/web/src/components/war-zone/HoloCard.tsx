import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoloCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'low' | 'medium' | 'high';
    hoverEffect?: boolean;
}

export const HoloCard = ({
    children,
    className,
    intensity = 'medium',
    hoverEffect = true,
    ...props
}: HoloCardProps) => {
    return (
        // @ts-ignore
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={hoverEffect ? { scale: 1.01 } : undefined}
            className={cn(
                "relative overflow-hidden rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-xl",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/10 before:via-transparent before:to-purple-500/10",
                "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
                className
            )}
            {...props}
        >
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-500 z-10" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-500 z-10" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-500 z-10" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-500 z-10" />

            {/* Content */}
            <div className="relative z-10 p-6 h-full">
                {children}
            </div>
        </motion.div>
    );
};
