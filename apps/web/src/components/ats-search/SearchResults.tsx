
import { ExternalLink, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/lib/search-api';
// import { toast } from 'sonner';

interface SearchResultsProps {
    results: SearchResult[];
    isLoading: boolean;
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6 space-y-3">
                            <div className="h-4 bg-muted w-3/4 rounded" />
                            <div className="h-3 bg-muted w-1/2 rounded" />
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No results found. Try adjusting your search query.
            </div>
        );
    }

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        // toast.success('Link copied to clipboard');
        console.log('Link copied to clipboard');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{results.length} Results Found</h3>
            </div>

            {results.map((result, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-lg hover:underline decoration-primary">
                                    <a href={result.link} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: result.htmlTitle }} />
                                </h4>
                                <p className="text-sm text-muted-foreground truncate max-w-2xl">{result.displayLink}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => copyLink(result.link)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={result.link} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-foreground/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: result.htmlSnippet }} />

                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
