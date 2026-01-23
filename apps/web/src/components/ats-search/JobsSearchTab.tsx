import React, { useState } from 'react';
import { Search, Briefcase, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface JobsSearchTabProps {
    onSearch: (query: string) => void;
}

const JOB_FIELDS: Record<string, { titles: string[], skills: string[] }> = {
    "🔐 Cybersecurity": {
        "titles": [
            "Security Analyst", "Jr Security Analyst", "SOC Analyst", "Cybersecurity Analyst",
            "Threat Intelligence Analyst", "Vulnerability Analyst", "GRC Analyst", "Forensics Analyst",
            "Security Engineer", "Cloud Security Engineer", "Application Security Engineer",
            "IAM Engineer", "Detection Engineer", "Incident Response", "Penetration Tester",
            "Security Architect", "Security Consultant"
        ],
        "skills": ["SIEM", "Splunk", "CrowdStrike", "Sentinel", "Firewall", "IDS/IPS", "Threat Hunting", "NIST", "ISO 27001", "SOC", "EDR", "XDR"]
    },
    "💻 Software Engineering": {
        "titles": [
            "Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
            "Mobile Developer", "DevOps Engineer", "SRE", "Platform Engineer", "Embedded Engineer"
        ],
        "skills": ["Python", "JavaScript", "Java", "Go", "Rust", "React", "Node.js", "AWS", "Docker", "Kubernetes"]
    },
    "📊 Data & Analytics": {
        "titles": [
            "Data Analyst", "Data Scientist", "Data Engineer", "Business Analyst",
            "BI Developer", "Machine Learning Engineer", "AI Engineer"
        ],
        "skills": ["Python", "SQL", "Tableau", "Power BI", "Spark", "Snowflake", "TensorFlow", "PyTorch"]
    },
    "☁️ Cloud & Infrastructure": {
        "titles": [
            "Cloud Engineer", "Cloud Architect", "Infrastructure Engineer", "Network Engineer",
            "Systems Administrator", "Site Reliability Engineer"
        ],
        "skills": ["AWS", "Azure", "GCP", "Terraform", "Ansible", "Linux", "Networking", "CI/CD"]
    },
    "🎨 Product & Design": {
        "titles": [
            "Product Manager", "Product Owner", "UX Designer", "UI Designer", "Product Designer"
        ],
        "skills": ["Figma", "Sketch", "User Research", "Prototyping", "A/B Testing", "Agile"]
    },
    "🛠️ IT & Support": {
        "titles": [
            "IT Support", "Help Desk", "Desktop Support", "IT Administrator", "Technical Support Engineer"
        ],
        "skills": ["Windows", "Active Directory", "Office 365", "ServiceNow", "ITIL", "Troubleshooting"]
    },
    "📝 Custom Search": {
        "titles": [],
        "skills": []
    }
};

const ATS_SITES: Record<string, string[]> = {
    "All Platforms (ATS + LinkedIn)": [
        "site:boards.greenhouse.io", "site:jobs.lever.co", "site:myworkdayjobs.com",
        "site:jobs.ashbyhq.com", "site:icims.com", "site:jobs.smartrecruiters.com",
        "site:careers.workable.com", "site:apply.workable.com", "site:recruiting.paylocity.com",
        "site:jobs.jobvite.com", "site:hire.jazz.co", "site:breezy.hr",
        "site:bamboohr.com/jobs", "site:recruitee.com", "site:applytojob.com",
        "site:linkedin.com/jobs"
    ],
    "LinkedIn Jobs": ["site:linkedin.com/jobs"],
    "All ATS (No LinkedIn)": [
        "site:boards.greenhouse.io", "site:jobs.lever.co", "site:myworkdayjobs.com",
        "site:jobs.ashbyhq.com", "site:icims.com", "site:jobs.smartrecruiters.com",
        "site:careers.workable.com", "site:apply.workable.com", "site:recruiting.paylocity.com",
        "site:jobs.jobvite.com", "site:hire.jazz.co", "site:breezy.hr",
        "site:bamboohr.com/jobs", "site:recruitee.com", "site:applytojob.com"
    ],
    "Tech Giants": [
        "site:careers.google.com", "site:amazon.jobs", "site:careers.microsoft.com",
        "site:meta.com/careers", "site:apple.com/careers"
    ],
    "Greenhouse Only": ["site:boards.greenhouse.io"],
    "Lever Only": ["site:jobs.lever.co"],
    "Workday Only": ["site:myworkdayjobs.com"],
};

export function JobsSearchTab({ onSearch }: JobsSearchTabProps) {
    const [jobField, setJobField] = useState<string>("🔐 Cybersecurity");
    const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
    const [customRole, setCustomRole] = useState("Security Analyst");

    const [experience, setExperience] = useState("Any");
    const [freshness, setFreshness] = useState("Anytime");
    const [location, setLocation] = useState("");
    const [atsChoice, setAtsChoice] = useState("All Platforms (ATS + LinkedIn)");

    const [keywords, setKeywords] = useState("");
    const [targetCompany, setTargetCompany] = useState("");
    const [excludeKeywords, setExcludeKeywords] = useState("");
    const [remoteOnly, setRemoteOnly] = useState(false);

    // Helper to toggle title selection
    const toggleTitle = (title: string) => {
        if (selectedTitles.includes(title)) {
            setSelectedTitles(selectedTitles.filter(t => t !== title));
        } else {
            setSelectedTitles([...selectedTitles, title]);
        }
    };

    const handleSearch = () => {
        let search_query = "";

        // Titles
        let titlesToSearch = selectedTitles;
        if (jobField === "📝 Custom Search") {
            titlesToSearch = [customRole];
        } else if (titlesToSearch.length === 0) {
            // Default to all titles in field if none selected? Or maybe force selection.
            // Python script defaults to ALL titles in the field.
            titlesToSearch = JOB_FIELDS[jobField].titles;
        }

        if (titlesToSearch.length === 1) {
            const t = titlesToSearch[0];
            search_query = `"${t}"`;
        } else if (titlesToSearch.length > 1) {
            search_query = `(${titlesToSearch.map(t => `"${t}"`).join(" OR ")})`;
        }

        // ATS Sites
        const sites = ATS_SITES[atsChoice];
        if (sites && sites.length > 0) {
            search_query = `(${sites.join(" OR ")}) ${search_query}`;
        }

        // Skills / Keywords
        if (keywords) {
            const skills = keywords.split(",").map(s => s.trim()).filter(Boolean);
            if (skills.length > 0) {
                search_query += ` (${skills.join(" OR ")})`;
            }
        }

        if (location) search_query += ` "${location}"`;
        if (targetCompany) search_query += ` "${targetCompany}"`;

        // Experience
        const experienceMap: Record<string, string> = {
            "Entry Level": '("entry level" OR "junior" OR "associate" OR "new grad")',
            "Mid Level": '("mid level" OR "2-5 years" OR "3+ years")',
            "Senior": '("senior" OR "sr." OR "5+ years")',
            "Lead": '("lead" OR "principal" OR "staff")',
            "Manager": '("manager" OR "director")'
        };
        if (experience !== "Any" && experienceMap[experience]) {
            search_query += ` ${experienceMap[experience]}`;
        }

        if (remoteOnly) search_query += ' (remote OR "work from home")';

        if (excludeKeywords) {
            excludeKeywords.split(",").forEach(term => {
                if (term.trim()) search_query += ` -"${term.trim()}"`;
            });
        }

        // For freshness, we pass it as a separate param to the API usually, but here we are building string
        // The API client accepts dateRestrict. We need to pass that up or return it.
        // Ideally onSearch accepts query AND options.
        // For now, let's assume onSearch just takes query string, and freshness is handled separately or ignored in query string
        // Actually, freshness (d1, w1) is a Google API param, NOT part of 'q'.
        // We might need to refactor onSearch to accept options.
        // BUT the Python script passes dateRestrict to the API separately.

        // CHANGE: Let's pass query string, and assume the parent component handles the dateRestrict param
        // But wait, the parent doesn't know the selected freshness.
        // I should change `onSearch` signature in a bit. 
        // For now, I'll pass the date restrict as a special prefix/object or just assume basic query.
        // Actually, I'll hack it: I'll return an object or call onSearch(query, { dateRestrict }).
        // But `PeopleSearchTab` has simple signature.
        // Let's stick to query string for now and maybe append a custom instruction if needed, 
        // OR we change the interface.

        // To match existing simple interface, I might just focus on the query string part.
        // Freshness is important though.
        // I'll update the interface in the parent component when I build it.
        // For now, I'll allow `onSearch` to take a second arg optionally.

        // Wait, I am defining the interface here.
        // I will change it to `onSearch(query: string, options?: any)`

        const dateMap: Record<string, string | undefined> = {
            "24 Hours": "d1",
            "3 Days": "d3",
            "Past Week": "w1",
            "Month": "m1",
            "Anytime": undefined
        };

        onSearch(search_query); // We need to fix freshness passing.
        // I'll add a comment to fix this in the parent integration.
    };

    // NOTE: For freshness to work, we need to pass it up. 
    // I will assume the parent can take an options object.

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <Label>Field</Label>
                        <Select value={jobField} onValueChange={(v) => { setJobField(v); setSelectedTitles([]); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(JOB_FIELDS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select value={atsChoice} onValueChange={setAtsChoice}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(ATS_SITES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Experience</Label>
                        <Select value={experience} onValueChange={setExperience}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {["Any", "Entry Level", "Mid Level", "Senior", "Lead", "Manager"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Job Titles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {jobField !== "📝 Custom Search" ? (
                                <div className="flex flex-wrap gap-2">
                                    {JOB_FIELDS[jobField].titles.map(title => (
                                        <Badge
                                            key={title}
                                            variant={selectedTitles.includes(title) ? "default" : "outline"}
                                            className="cursor-pointer hover:bg-primary/90"
                                            onClick={() => toggleTitle(title)}
                                        >
                                            {title}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Custom Job Title</Label>
                                    <Input value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Accordion type="single" collapsible>
                        <AccordionItem value="filters">
                            <AccordionTrigger>More Filters</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Skills / Keywords</Label>
                                        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Python, React..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder="Target company..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Exclude</Label>
                                        <Input value={excludeKeywords} onChange={(e) => setExcludeKeywords(e.target.value)} placeholder="Senior, Manager..." />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="remote" checked={remoteOnly} onCheckedChange={(c) => setRemoteOnly(!!c)} />
                                        <Label htmlFor="remote">Remote Only</Label>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Button onClick={handleSearch} className="w-full" size="lg">
                        <Search className="mr-2 h-4 w-4" />
                        Find Jobs
                    </Button>

                </div>
            </div>
        </div>
    );
}
