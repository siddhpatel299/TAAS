import React, { createContext, useContext, useState, useEffect } from 'react';

type AppVersion = 'standard' | 'war-zone';

interface VersionContextType {
    version: AppVersion;
    setVersion: (version: AppVersion) => void;
    toggleVersion: () => void;
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

        // Apply theme classes to body
        if (v === 'war-zone') {
            document.documentElement.classList.add('war-zone');
            document.body.classList.add('war-zone-mode');
        } else {
            document.documentElement.classList.remove('war-zone');
            document.body.classList.remove('war-zone-mode');
        }
    };

    const toggleVersion = () => {
        setVersion(version === 'standard' ? 'war-zone' : 'standard');
    };

    // Sync on mount
    useEffect(() => {
        setVersion(version);
    }, []);

    return (
        <VersionContext.Provider value={{ version, setVersion, toggleVersion }}>
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
