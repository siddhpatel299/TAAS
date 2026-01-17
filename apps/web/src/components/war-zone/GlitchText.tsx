

export const GlitchText = ({ text, className }: { text: string; className?: string }) => {
    return (
        <div className={`relative inline-block group ${className}`}>
            <span className="relative z-10">{text}</span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-500 opacity-70 animate-pulse group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-100 mix-blend-screen">
                {text}
            </span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-70 animate-pulse group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-100 mix-blend-screen delay-75">
                {text}
            </span>
        </div>
    );
};
