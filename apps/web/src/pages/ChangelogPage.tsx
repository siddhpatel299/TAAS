import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Filter, TrendingUp, BarChart3, Star, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import changelogData from '../data/changelog.json';

// Helper to get icon based on change title or type
const getChangeIcon = (title: string, type: string) => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('notification')) return <Bell className="w-5 h-5 text-indigo-500" />;
    if (lowerTitle.includes('filter') || lowerTitle.includes('search')) return <Filter className="w-5 h-5 text-indigo-500" />;
    if (lowerTitle.includes('trend') || lowerTitle.includes('chart')) return <TrendingUp className="w-5 h-5 text-indigo-500" />;
    if (lowerTitle.includes('efficiency') || lowerTitle.includes('metric')) return <BarChart3 className="w-5 h-5 text-indigo-500" />;
    if (lowerTitle.includes('feature') || type === 'new') return <Star className="w-5 h-5 text-indigo-500" />;
    if (type === 'fix') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;

    return <Zap className="w-5 h-5 text-indigo-500" />;
};

const getTagColor = (type: string) => {
    switch (type) {
        case 'new': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'enhanced': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'fix': return 'bg-orange-100 text-orange-700 border-orange-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const formatTagLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

export function ChangelogPage() {
    const navigate = useNavigate();
    const latestVersion = changelogData[0]?.version;

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                    <Star className="w-6 h-6 text-white fill-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Changelog</h1>
                            </div>
                            <p className="text-slate-500 text-lg">Stay up to date with the latest improvements and features</p>
                        </div>

                        <div className="inline-flex items-center px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-sm font-medium text-indigo-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            Current: {latestVersion}
                        </div>
                    </div>
                </motion.div>

                {/* Timeline */}
                <div className="relative pl-8 md:pl-0">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-[179px] top-4 bottom-0 w-px bg-indigo-100"></div>

                    <div className="space-y-16">
                        {changelogData.map((release, index) => (
                            <motion.div
                                key={release.version}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative md:grid md:grid-cols-[180px_1fr] gap-8"
                            >
                                {/* Release Info (Left items) */}
                                <div className="md:text-right mb-4 md:mb-0 relative">
                                    {/* Dot on timeline */}
                                    <div className="absolute -left-8 md:-right-[33px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md ring-4 ring-white z-10">
                                        {changelogData.length - index}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900">{release.version}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{release.date}</p>
                                    <p className="text-xs text-indigo-600 mt-1 font-medium">{release.title}</p>
                                </div>

                                {/* Content (Right Side) */}
                                <div className="space-y-4">
                                    {release.changes.map((change, cIndex) => (
                                        <motion.div
                                            key={cIndex}
                                            whileHover={{ scale: 1.01, y: -2 }}
                                            className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    {getChangeIcon(change.title, change.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center flex-wrap gap-2 mb-1">
                                                        <h4 className="font-semibold text-slate-900">{change.title}</h4>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getTagColor(change.type)}`}>
                                                            {formatTagLabel(change.type)}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 leading-relaxed text-sm">
                                                        {change.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-24 text-center pb-12">
                    <p className="text-slate-400 text-sm">End of changelog</p>
                </div>
            </div>
        </div>
    );
}

export default ChangelogPage;
