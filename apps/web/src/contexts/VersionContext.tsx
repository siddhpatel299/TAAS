import React, { createContext, useContext, useState, useEffect } from 'react';

type AppVersion = 'standard' | 'hud';

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
        document.documentElement.classList.remove('hud-theme');
        document.body.classList.remove('hud-mode');

        // Apply theme classes based on version
        if (v === 'hud') {
            document.documentElement.classList.add('hud-theme');
            document.body.classList.add('hud-mode');
        }
    };

    const toggleVersion = () => {
        // Toggle between standard and hud
        setVersion(version === 'standard' ? 'hud' : 'standard');
    };

    const cycleVersion = () => {
        // Cycle through themes: standard -> hud -> standard
        setVersion(version === 'standard' ? 'hud' : 'standard');
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
