import React, { useState } from 'react';
import { Search, TrendingUp, AlertTriangle, Award, Code, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CompanySearchTabProps {
    onSearch: (query: string) => void;
}

export function CompanySearchTab({ onSearch }: CompanySearchTabProps) {
    const [searchType, setSearchType] = useState<'funding' | 'risk' | 'awards' | 'tech'>('funding');
    const [targetCompany, setTargetCompany] = useState('');

    const handleSearch = () => {
        let query = '';
        const company = targetCompany || 'Company Name';

        if (searchType === 'funding') {
            query = `"${company}" ("series A" OR "series B" OR "series C" OR funding OR "raised" OR "venture capital")`;
        } else if (searchType === 'risk') {
            query = `"${company}" (layoffs OR "hiring freeze" OR restructuring OR "laid off" OR downsizing)`;
        } else if (searchType === 'awards') {
            query = `"${company}" ("best place to work" OR award OR recognition OR "top employer" OR "Inc 5000")`;
        } else if (searchType === 'tech') {
            query = `"${company}" site:stackshare.io OR "tech stack" OR "we use" OR "built with"`;
        }

        onSearch(query);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { id: 'funding', label: 'Growth', icon: TrendingUp },
                    { id: 'risk', label: 'Risks', icon: AlertTriangle },
                    { id: 'awards', label: 'Awards', icon: Award },
                    { id: 'tech', label: 'Tech Stack', icon: Code },
                ].map((type) => (
                    <Button
                        key={type.id}
                        variant={searchType === type.id ? 'default' : 'outline'}
                        className="h-24 flex flex-col gap-2"
                        onClick={() => setSearchType(type.id as any)}
                    >
                        <type.icon className="h-6 w-6" />
                        {type.label}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {searchType === 'funding' && 'Funding & Growth Signals'}
                        {searchType === 'risk' && 'Layoff & Risk Indicators'}
                        {searchType === 'awards' && 'Awards & Recognition'}
                        {searchType === 'tech' && 'Tech Stack & Tools'}
                    </CardTitle>
                    <CardDescription>
                        {searchType === 'funding' && 'Track recent funding rounds and investor activity.'}
                        {searchType === 'risk' && 'Monitor company usually stability before applying.'}
                        {searchType === 'awards' && 'Find company accolades and culture indicators.'}
                        {searchType === 'tech' && 'Discover what technologies the engineering team uses.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="space-y-2">
                        <Label>Target Company</Label>
                        <div className="flex space-x-2">
                            <Building className="mt-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>

                    <Button onClick={handleSearch} className="w-full" size="lg" disabled={!targetCompany}>
                        <Search className="mr-2 h-4 w-4" />
                        Research Company
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
