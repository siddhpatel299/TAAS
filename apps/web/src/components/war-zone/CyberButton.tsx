import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}

export const CyberButton = ({ children, className, variant = 'primary', ...props }: CyberButtonProps) => {
    const variants = {
        primary: "border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]",
        secondary: "border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]",
        danger: "border-red-500 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    };

    return (
        // @ts-ignore
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative px-6 py-3 font-mono text-sm tracking-wider uppercase border-2 transition-all duration-300 bg-black/50 backdrop-blur-sm clip-path-polygon",
                variants[variant],
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 bg-transparent" style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%)" }} />
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};
