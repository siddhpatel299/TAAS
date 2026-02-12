import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
    company: string;
    companyLogo?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// Convert company name to a likely domain for logo lookup
function companyToDomain(company: string): string {
    const cleaned = company
        .toLowerCase()
        .replace(/\s*(inc\.?|llc|ltd\.?|corp\.?|co\.?|group|technologies|technology|tech|systems?|solutions?|services?)\s*$/i, '')
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '');
    return cleaned + '.com';
}

const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg text-sm',
    md: 'w-12 h-12 rounded-xl text-lg',
    lg: 'w-16 h-16 rounded-xl text-2xl',
};

export function CompanyLogo({ company, companyLogo, size = 'lg', className }: CompanyLogoProps) {
    const [imgError, setImgError] = useState(false);
    const [fallbackError, setFallbackError] = useState(false);

    const initial = company?.charAt(0)?.toUpperCase() || '?';
    const domain = companyToDomain(company);

    // Primary: scraped logo from job posting (usually high-res)
    const primarySrc = companyLogo && !imgError ? companyLogo : null;

    // Fallback: Google's higher-quality favicon endpoint (returns Apple Touch icons when available = 180x180px)
    const fallbackSrc = !fallbackError
        ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`
        : null;

    const activeSrc = primarySrc || fallbackSrc;

    if (activeSrc) {
        return (
            <div className={cn(sizeClasses[size], 'overflow-hidden shrink-0 bg-white border border-gray-100 flex items-center justify-center p-1.5', className)}>
                <img
                    src={activeSrc}
                    alt={`${company} logo`}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => {
                        if (primarySrc) setImgError(true);
                        else setFallbackError(true);
                    }}
                    loading="lazy"
                />
            </div>
        );
    }

    // Final fallback: initial letter
    return (
        <div className={cn(
            sizeClasses[size],
            'bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0',
            className
        )}>
            {initial}
        </div>
    );
}
