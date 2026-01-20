import React, { createContext, useContext, useState, useEffect } from 'react';

type AppVersion = 'standard' | 'hud' | 'forest' | 'terminal' | 'origami' | 'blueprint' | 'newsprint' | 'brutalist' | 'crt' | 'glass' | 'artdeco' | 'canvas' | 'comic' | 'archive' | 'steam' | 'aurora';

interface VersionContextType {
    version: AppVersion;
    setVersion: (version: AppVersion) => void;
    toggleVersion: () => void;
    cycleVersion: () => void;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export function VersionProvider({ children }: { children: React.ReactNode }) {
    const [version, setVersionState] = useState<AppVersion>(() => {
        const saved = localStorage.getItem('app_version');
        // Migrate old war-zone theme to standard
        if (saved === 'war-zone') return 'standard';
        return (saved as AppVersion) || 'standard';
    });

    const setVersion = (v: AppVersion) => {
        setVersionState(v);
        localStorage.setItem('app_version', v);

        // Remove all theme classes first
        document.documentElement.classList.remove('hud-theme', 'forest-theme', 'terminal-theme', 'origami-theme', 'blueprint-theme', 'newsprint-theme', 'brutalist-theme', 'crt-theme', 'glass-theme', 'deco-theme', 'canvas-theme', 'comic-theme', 'archive-theme', 'steam-theme', 'aurora-theme');
        document.body.classList.remove('hud-mode', 'forest-mode', 'terminal-mode', 'origami-mode', 'blueprint-mode', 'newsprint-mode', 'brutalist-mode', 'crt-mode', 'glass-mode', 'deco-mode', 'canvas-mode', 'comic-mode', 'archive-mode', 'steam-mode', 'aurora-mode');

        // Apply theme classes based on version
        if (v === 'hud') {
            document.documentElement.classList.add('hud-theme');
            document.body.classList.add('hud-mode');
        } else if (v === 'forest') {
            document.documentElement.classList.add('forest-theme');
            document.body.classList.add('forest-mode');
        } else if (v === 'terminal') {
            document.documentElement.classList.add('terminal-theme');
            document.body.classList.add('terminal-mode');
        } else if (v === 'origami') {
            document.documentElement.classList.add('origami-theme');
            document.body.classList.add('origami-mode');
        } else if (v === 'blueprint') {
            document.documentElement.classList.add('blueprint-theme');
            document.body.classList.add('blueprint-mode');
        } else if (v === 'newsprint') {
            document.documentElement.classList.add('newsprint-theme');
            document.body.classList.add('newsprint-mode');
        } else if (v === 'brutalist') {
            document.documentElement.classList.add('brutalist-theme');
            document.body.classList.add('brutalist-mode');
        } else if (v === 'crt') {
            document.documentElement.classList.add('crt-theme');
            document.body.classList.add('crt-mode');
        } else if (v === 'glass') {
            document.documentElement.classList.add('glass-theme');
            document.body.classList.add('glass-mode');
        } else if (v === 'artdeco') {
            document.documentElement.classList.add('deco-theme');
            document.body.classList.add('deco-mode');
        } else if (v === 'canvas') {
            document.documentElement.classList.add('canvas-theme');
            document.body.classList.add('canvas-mode');
        } else if (v === 'comic') {
            document.documentElement.classList.add('comic-theme');
            document.body.classList.add('comic-mode');
        } else if (v === 'archive') {
            document.documentElement.classList.add('archive-theme');
            document.body.classList.add('archive-mode');
        } else if (v === 'steam') {
            document.documentElement.classList.add('steam-theme');
            document.body.classList.add('steam-mode');
        } else if (v === 'aurora') {
            document.documentElement.classList.add('aurora-theme');
            document.body.classList.add('aurora-mode');
        }
    };

    const toggleVersion = () => {
        // Toggle between standard and hud
        setVersion(version === 'standard' ? 'hud' : 'standard');
    };

    const cycleVersion = () => {
        // Cycle through themes: standard -> hud -> forest -> terminal -> standard
        const versions: AppVersion[] = ['standard', 'hud', 'forest', 'terminal', 'origami', 'blueprint', 'newsprint', 'brutalist', 'crt', 'glass', 'artdeco', 'canvas', 'comic', 'archive', 'steam', 'aurora'];
        const currentIndex = versions.indexOf(version);
        const nextIndex = (currentIndex + 1) % versions.length;
        setVersion(versions[nextIndex]);
    };

    // Sync on mount
    useEffect(() => {
        setVersion(version);
    }, []);

    return (
        <VersionContext.Provider value={{ version, setVersion, toggleVersion, cycleVersion }}>
            {children}
        </VersionContext.Provider>
    );
}

export const useVersion = () => {
    const context = useContext(VersionContext);
    if (context === undefined) {
        throw new Error('useVersion must be used within a VersionProvider');
    }
    return context;
};
