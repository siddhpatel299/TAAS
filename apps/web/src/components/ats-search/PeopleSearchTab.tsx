import { useState } from 'react';
import { Search, MapPin, Building, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PeopleSearchTabProps {
    onSearch: (query: string) => void;
}

export function PeopleSearchTab({ onSearch }: PeopleSearchTabProps) {
    const [searchType, setSearchType] = useState<'company' | 'alumni' | 'recruiters' | 'custom'>('company');

    // State for Company Search
    const [targetCompany, setTargetCompany] = useState('CrowdStrike');
    const [targetRole, setTargetRole] = useState('Security');
    const [seniority, setSeniority] = useState('Any');
    const [targetSchool, setTargetSchool] = useState('');

    // State for Alumni Search
    const [mySchool, setMySchool] = useState('Arizona State University');
    const [alumniCompanies, setAlumniCompanies] = useState('CrowdStrike, Palo Alto, Microsoft');
    const [alumniField, setAlumniField] = useState('Any');
    const [gradYear, setGradYear] = useState('');

    // State for Recruiter Search
    const [recruiterCompany, setRecruiterCompany] = useState('CrowdStrike');
    const [recruiterType, setRecruiterType] = useState('Any Recruiter');
    const [recruiterFocus, setRecruiterFocus] = useState('Security');
    const [includeAgency, setIncludeAgency] = useState(false);

    // State for Custom Search
    const [customKeywords, setCustomKeywords] = useState('cybersecurity manager');
    const [customCompany, setCustomCompany] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    const [customSchool, setCustomSchool] = useState('');

    // Common Filters
    const [locationFilter, setLocationFilter] = useState('');
    const [excludeTerms, setExcludeTerms] = useState('');
    const [openToWork, setOpenToWork] = useState(false);

    const handleSearch = () => {
        let query = '';

        if (searchType === 'company') {
            query = `site:linkedin.com/in/ "${targetCompany}"`;
            if (targetRole) query += ` ${targetRole}`;

            const seniorityMap: Record<string, string> = {
                "Entry/Junior": '(junior OR entry OR associate OR "new grad")',
                "Mid-Level": '(mid OR "3 years" OR "4 years" OR "5 years")',
                "Senior": '(senior OR sr OR lead)',
                "Manager": '(manager OR "team lead")',
                "Director": '(director)',
                "VP/Executive": '(VP OR "vice president" OR chief OR executive OR head)'
            };

            if (seniority !== 'Any' && seniorityMap[seniority]) {
                query += ` ${seniorityMap[seniority]}`;
            }
            if (targetSchool) query += ` "${targetSchool}"`;

        } else if (searchType === 'alumni') {
            query = `site:linkedin.com/in/ "${mySchool}"`;

            if (alumniCompanies) {
                const companies = alumniCompanies.split(',').map(c => c.trim()).filter(Boolean);
                if (companies.length > 0) {
                    query += ` (${companies.map(c => `"${c}"`).join(' OR ')})`;
                }
            }

            if (alumniField !== 'Any') query += ` ${alumniField}`;
            if (gradYear) query += ` ${gradYear}`;

        } else if (searchType === 'recruiters') {
            const recruiterTerms: Record<string, string> = {
                "Any Recruiter": '(recruiter OR recruiting OR "talent acquisition" OR HR)',
                "Technical Recruiter": '("technical recruiter" OR "engineering recruiter" OR "tech recruiting")',
                "University Recruiter": '("university recruiter" OR "campus recruiter" OR "early career" OR "new grad recruiting")',
                "HR/People Ops": '(HR OR "human resources" OR "people operations" OR "people ops")',
                "Talent Acquisition Lead": '("talent acquisition" OR "recruiting manager" OR "head of recruiting")'
            };

            query = `site:linkedin.com/in/ "${recruiterCompany}" ${recruiterTerms[recruiterType] || 'recruiter'}`;
            if (recruiterFocus) query += ` ${recruiterFocus}`;
            if (!includeAgency) query += ' -agency -staffing -consulting';

        } else {
            query = `site:linkedin.com/in/ ${customKeywords}`;
            if (customCompany) query += ` "${customCompany}"`;
            if (customLocation) query += ` "${customLocation}"`;
            if (customSchool) query += ` "${customSchool}"`;
        }

        // Common Appends
        if (locationFilter) query += ` "${locationFilter}"`;

        if (excludeTerms) {
            excludeTerms.split(',').forEach(term => {
                if (term.trim()) query += ` -${term.trim()}`;
            });
        }

        if (openToWork) {
            query += ' (hiring OR "open to" OR seeking OR looking)';
        }

        onSearch(query);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { id: 'company', label: 'Company', icon: Building },
                    { id: 'alumni', label: 'Alumni', icon: GraduationCap },
                    { id: 'recruiters', label: 'Recruiters', icon: Users },
                    { id: 'custom', label: 'Custom', icon: Search },
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
                        {searchType === 'company' && 'Find Employees at Target Company'}
                        {searchType === 'alumni' && 'Find Alumni from Your School'}
                        {searchType === 'recruiters' && 'Find Recruiters'}
                        {searchType === 'custom' && 'Build Custom Search'}
                    </CardTitle>
                    <CardDescription>
                        {searchType === 'company' && 'Search for people with specific roles at a target company.'}
                        {searchType === 'alumni' && 'Leverage your alumni network to get referrals.'}
                        {searchType === 'recruiters' && 'Directly reach out to decision makers.'}
                        {searchType === 'custom' && 'Use boolean logic to find exactly who you need.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {searchType === 'company' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Target Company</Label>
                                <Input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder="e.g. Google" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role / Department</Label>
                                <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Engineering" />
                            </div>
                            <div className="space-y-2">
                                <Label>Seniority</Label>
                                <Select value={seniority} onValueChange={setSeniority}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["Any", "Entry/Junior", "Mid-Level", "Senior", "Manager", "Director", "VP/Executive"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>From School (Optional)</Label>
                                <Input value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)} placeholder="Alumni filter" />
                            </div>
                        </div>
                    )}

                    {searchType === 'alumni' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Your School</Label>
                                <Input value={mySchool} onChange={(e) => setMySchool(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Companies (Comma separated)</Label>
                                <Input value={alumniCompanies} onChange={(e) => setAlumniCompanies(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Field</Label>
                                <Select value={alumniField} onValueChange={setAlumniField}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["Any", "Cybersecurity", "Software Engineering", "Data Science", "Product", "Finance", "Consulting"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Graduation Year</Label>
                                <Input value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="e.g. 2024" />
                            </div>
                        </div>
                    )}

                    {searchType === 'recruiters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input value={recruiterCompany} onChange={(e) => setRecruiterCompany(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Recruiter Type</Label>
                                <Select value={recruiterType} onValueChange={setRecruiterType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["Any Recruiter", "Technical Recruiter", "University Recruiter", "HR/People Ops", "Talent Acquisition Lead"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Focus Area</Label>
                                <Input value={recruiterFocus} onChange={(e) => setRecruiterFocus(e.target.value)} placeholder="e.g. Engineering" />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Checkbox id="agency" checked={includeAgency} onCheckedChange={(c) => setIncludeAgency(!!c)} />
                                <Label htmlFor="agency">Include Agency/Staffing</Label>
                            </div>
                        </div>
                    )}

                    {searchType === 'custom' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Keywords</Label>
                                <Input value={customKeywords} onChange={(e) => setCustomKeywords(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input value={customCompany} onChange={(e) => setCustomCompany(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>School</Label>
                                <Input value={customSchool} onChange={(e) => setCustomSchool(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <Accordion type="single" collapsible>
                        <AccordionItem value="advanced">
                            <AccordionTrigger>Advanced Filters</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Location Filter</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-8" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="City, State, or Country" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Exclude Terms</Label>
                                        <Input value={excludeTerms} onChange={(e) => setExcludeTerms(e.target.value)} placeholder="intern, student" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="opentowork" checked={openToWork} onCheckedChange={(c) => setOpenToWork(!!c)} />
                                        <Label htmlFor="opentowork">Likely "Open to Work"</Label>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Button onClick={handleSearch} className="w-full" size="lg">
                        <Search className="mr-2 h-4 w-4" />
                        Find People
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
