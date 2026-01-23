import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeopleSearchTab } from '@/components/ats-search/PeopleSearchTab';
import { JobsSearchTab } from '@/components/ats-search/JobsSearchTab';
import { CompanySearchTab } from '@/components/ats-search/CompanySearchTab';
import { SearchResults } from '@/components/ats-search/SearchResults';
import { searchApi, SearchResult } from '@/lib/search-api';

export function ATSSearchPage() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('people');

    const handleSearch = async (query: string) => {
        if (!query) return;
        setIsLoading(true);
        setResults([]);

        try {
            const response = await searchApi.search({ q: query });
            if (response.data.success) {
                setResults(response.data.data);
            } else {
                console.error("Search failed");
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || "Failed to perform search. Check API quota.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ModernSidebar />

            <main className="flex-1 ml-20 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Search className="w-8 h-8 text-primary" />
                            ATS X-Ray Search Pro
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Advanced boolean search for finding candidates, jobs, and company intelligence.
                        </p>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="people" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12">
                            <TabsTrigger value="people" className="text-sm">People</TabsTrigger>
                            <TabsTrigger value="jobs" className="text-sm">Jobs</TabsTrigger>
                            <TabsTrigger value="company" className="text-sm">Company Research</TabsTrigger>
                            <TabsTrigger value="saved" className="text-sm" disabled>Saved (Soon)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="people" className="space-y-6">
                            <PeopleSearchTab onSearch={handleSearch} />
                        </TabsContent>

                        <TabsContent value="jobs" className="space-y-6">
                            <JobsSearchTab onSearch={handleSearch} />
                        </TabsContent>

                        <TabsContent value="company" className="space-y-6">
                            <CompanySearchTab onSearch={handleSearch} />
                        </TabsContent>
                    </Tabs>

                    {/* Results Section */}
                    {(results.length > 0 || isLoading) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between border-b pb-2">
                                <h2 className="text-xl font-semibold">Search Results</h2>
                            </div>
                            <SearchResults results={results} isLoading={isLoading} />
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
