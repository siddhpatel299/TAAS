import React, { createContext, useContext, useState, useEffect } from 'react';

type AppVersion = 'standard' | 'war-zone' | 'hud';

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
        return (saved as AppVersion) || 'standard';
    });

    const setVersion = (v: AppVersion) => {
        setVersionState(v);
        localStorage.setItem('app_version', v);

        // Remove all theme classes first
        document.documentElement.classList.remove('war-zone', 'hud-theme');
        document.body.classList.remove('war-zone-mode', 'hud-mode');

        // Apply theme classes based on version
        if (v === 'war-zone') {
            document.documentElement.classList.add('war-zone');
            document.body.classList.add('war-zone-mode');
        } else if (v === 'hud') {
            document.documentElement.classList.add('hud-theme');
            document.body.classList.add('hud-mode');
        }
    };

    const toggleVersion = () => {
        // Toggle between standard and war-zone (legacy behavior)
        setVersion(version === 'standard' ? 'war-zone' : 'standard');
    };

    const cycleVersion = () => {
        // Cycle through all themes: standard -> hud -> war-zone -> standard
        const versions: AppVersion[] = ['standard', 'hud', 'war-zone'];
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
