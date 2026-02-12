import { ApiError } from '../middleware/error.middleware';

export interface ScrapedJobData {
  company: string;
  companyLogo?: string;
  jobTitle: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  jobUrl: string;
  source: string;
  postedDate?: string;
  applicants?: string;
}

// Helper to extract JSON-LD data from HTML
function extractJsonLd(html: string): any {
  const jsonLdMatch = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      return JSON.parse(jsonLdMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to clean HTML text
function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text between patterns
function extractBetween(html: string, startPattern: RegExp, endPattern: RegExp): string | null {
  const startMatch = html.match(startPattern);
  if (!startMatch) return null;

  const startIndex = startMatch.index! + startMatch[0].length;
  const remaining = html.slice(startIndex);
  const endMatch = remaining.match(endPattern);

  if (!endMatch) return remaining.slice(0, 5000);
  return remaining.slice(0, endMatch.index);
}

// Parse salary string to numbers
function parseSalary(salaryText: string): { min?: number; max?: number; currency?: string } {
  if (!salaryText) return {};

  // Match currency symbols
  const currencyMatch = salaryText.match(/[$€£₹]/);
  let currency = 'USD';
  if (currencyMatch) {
    const currencyMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
    currency = currencyMap[currencyMatch[0]] || 'USD';
  }

  // Match numbers (handle K for thousands)
  const numbers = salaryText.match(/[\d,]+(?:\.\d+)?[Kk]?/g);
  if (!numbers || numbers.length === 0) return { currency };

  const parseNum = (s: string): number => {
    const cleaned = s.replace(/,/g, '');
    const isK = /[Kk]$/.test(cleaned);
    const num = parseFloat(cleaned.replace(/[Kk]$/, ''));
    return isK ? num * 1000 : num;
  };

  if (numbers.length === 1) {
    return { min: parseNum(numbers[0]), currency };
  }

  return {
    min: parseNum(numbers[0]),
    max: parseNum(numbers[1]),
    currency,
  };
}

// Map employment type strings to our format
function mapEmploymentType(type: string | undefined): string | undefined {
  if (!type) return undefined;
  const lower = type.toLowerCase();
  if (lower.includes('full') && lower.includes('time')) return 'full_time';
  if (lower.includes('part') && lower.includes('time')) return 'part_time';
  if (lower.includes('contract')) return 'contract';
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('freelance')) return 'freelance';
  if (lower.includes('remote')) return 'remote';
  return undefined;
}

export const jobScraperService = {
  async scrapeLinkedIn(url: string): Promise<ScrapedJobData> {
    // Validate LinkedIn URL
    if (!url.includes('linkedin.com/jobs')) {
      throw new ApiError('Invalid LinkedIn job URL. Please provide a valid LinkedIn job posting URL.', 400);
    }

    // Normalize URL - extract job ID and construct clean URL
    const jobIdMatch = url.match(/(?:jobs\/view\/|currentJobId=)(\d+)/);
    if (!jobIdMatch) {
      throw new ApiError('Could not find job ID in the LinkedIn URL.', 400);
    }

    const jobId = jobIdMatch[1];
    const cleanUrl = `https://www.linkedin.com/jobs/view/${jobId}`;

    try {
      // Fetch the page - LinkedIn's public job pages work without auth
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new ApiError(`Failed to fetch LinkedIn page: ${response.status}`, 400);
      }

      const html = await response.text();

      // Try JSON-LD first (most reliable)
      const jsonLd = extractJsonLd(html);
      if (jsonLd) {
        const job = Array.isArray(jsonLd) ? jsonLd.find((j: any) => j['@type'] === 'JobPosting') : jsonLd;
        if (job && job['@type'] === 'JobPosting') {
          const salary = job.baseSalary?.value || {};
          return {
            company: job.hiringOrganization?.name || '',
            companyLogo: job.hiringOrganization?.logo || undefined,
            jobTitle: job.title || '',
            location: job.jobLocation?.address?.addressLocality ||
              (typeof job.jobLocation === 'string' ? job.jobLocation : ''),
            employmentType: mapEmploymentType(job.employmentType),
            salaryMin: salary.minValue,
            salaryMax: salary.maxValue,
            salaryCurrency: salary.currency || salary.unitText?.match(/[A-Z]{3}/)?.[0],
            jobDescription: cleanText(job.description),
            jobUrl: cleanUrl,
            source: 'LinkedIn',
            postedDate: job.datePosted,
          };
        }
      }

      // Fallback: Parse HTML directly
      let company = '';
      let companyLogo: string | undefined;
      let jobTitle = '';
      let location = '';
      let description = '';
      let employmentType: string | undefined;
      let salaryText = '';

      // Try to extract company logo from HTML
      const logoPatterns = [
        /<img[^>]*class="[^"]*org-top-card-primary-content__logo[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*class="[^"]*artdeco-entity-image[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*class="[^"]*EntityPhoto[^"]*"[^>]*src="([^"]+)"/i,
      ];
      for (const pattern of logoPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].startsWith('http')) {
          companyLogo = match[1];
          break;
        }
      }

      // Job title - multiple patterns
      const titlePatterns = [
        /<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)</i,
        /<h1[^>]*>([^<]+)</i,
        /<title>([^|<]+)/i,
      ];
      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match) {
          jobTitle = cleanText(match[1]).replace(/\s*\|.*$/, '').replace(/\s*-.*LinkedIn.*$/i, '');
          if (jobTitle) break;
        }
      }

      // Company name - multiple patterns
      const companyPatterns = [
        /<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)</i,
        /<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([^<]+)</i,
        /<a[^>]*href="[^"]*\/company\/[^"]*"[^>]*>([^<]+)</i,
      ];
      for (const pattern of companyPatterns) {
        const match = html.match(pattern);
        if (match) {
          company = cleanText(match[1]);
          if (company) break;
        }
      }

      // Location
      const locationPatterns = [
        /<span[^>]*class="[^"]*topcard__flavor[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)</i,
        /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)</i,
      ];
      for (const pattern of locationPatterns) {
        const match = html.match(pattern);
        if (match) {
          location = cleanText(match[1]);
          if (location) break;
        }
      }

      // Description - improved patterns for LinkedIn
      const descPatterns = [
        /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/i,
        /<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
        /<div[^>]*class="[^"]*jobs-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*class="[^"]*jobs-description[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
      ];
      for (const pattern of descPatterns) {
        const match = html.match(pattern);
        if (match) {
          // Clean the HTML but preserve some structure
          let rawDesc = match[1];
          // Replace <br> and </p> with newlines
          rawDesc = rawDesc.replace(/<br\s*\/?>/gi, '\n');
          rawDesc = rawDesc.replace(/<\/p>/gi, '\n\n');
          rawDesc = rawDesc.replace(/<\/li>/gi, '\n');
          rawDesc = rawDesc.replace(/<li[^>]*>/gi, '• ');
          description = cleanText(rawDesc);
          if (description && description.length > 50) break;
        }
      }

      // If still no description, try to find any large text block
      if (!description || description.length < 50) {
        const genericDescMatch = html.match(/<div[^>]*>([\s\S]{200,}?)<\/div>/i);
        if (genericDescMatch) {
          const cleaned = cleanText(genericDescMatch[1]);
          // Only use if it looks like a job description (has common keywords)
          if (cleaned.length > 200 && /responsibilities|qualifications|requirements|experience|skills/i.test(cleaned)) {
            description = cleaned;
          }
        }
      }

      // Employment type
      const empTypeMatch = html.match(/(?:Employment type|Job type)[^<]*<[^>]*>([^<]+)/i);
      if (empTypeMatch) {
        employmentType = mapEmploymentType(cleanText(empTypeMatch[1]));
      }

      // Salary
      const salaryMatch = html.match(/(?:Salary|Compensation)[^<]*<[^>]*>([^<]+)/i);
      if (salaryMatch) {
        salaryText = cleanText(salaryMatch[1]);
      }

      const salaryData = parseSalary(salaryText);

      // Check if we got meaningful data
      if (!jobTitle && !company) {
        throw new ApiError('Could not extract job details. The job posting may be private or no longer available.', 400);
      }

      return {
        company: company || 'Unknown Company',
        companyLogo,
        jobTitle: jobTitle || 'Unknown Position',
        location: location || undefined,
        employmentType,
        salaryMin: salaryData.min,
        salaryMax: salaryData.max,
        salaryCurrency: salaryData.currency,
        jobDescription: description || undefined,
        jobUrl: cleanUrl,
        source: 'LinkedIn',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('LinkedIn scraping error:', error);
      throw new ApiError('Failed to scrape LinkedIn job posting. Please try again or enter details manually.', 500);
    }
  },

  async scrapeIndeed(url: string): Promise<ScrapedJobData> {
    if (!url.includes('indeed.com')) {
      throw new ApiError('Invalid Indeed job URL.', 400);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new ApiError(`Failed to fetch Indeed page: ${response.status}`, 400);
      }

      const html = await response.text();

      // Try JSON-LD
      const jsonLd = extractJsonLd(html);
      if (jsonLd && jsonLd['@type'] === 'JobPosting') {
        const salary = jsonLd.baseSalary?.value || {};
        return {
          company: jsonLd.hiringOrganization?.name || '',
          companyLogo: jsonLd.hiringOrganization?.logo || undefined,
          jobTitle: jsonLd.title || '',
          location: jsonLd.jobLocation?.address?.addressLocality || '',
          employmentType: mapEmploymentType(jsonLd.employmentType),
          salaryMin: salary.minValue,
          salaryMax: salary.maxValue,
          salaryCurrency: salary.currency,
          jobDescription: cleanText(jsonLd.description),
          jobUrl: url,
          source: 'Indeed',
        };
      }

      // Fallback HTML parsing
      const titleMatch = html.match(/<h1[^>]*class="[^"]*jobTitle[^"]*"[^>]*>([^<]+)</i);
      const companyMatch = html.match(/<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)</i);
      const locationMatch = html.match(/<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)</i);

      return {
        company: cleanText(companyMatch?.[1]) || 'Unknown Company',
        jobTitle: cleanText(titleMatch?.[1]) || 'Unknown Position',
        location: cleanText(locationMatch?.[1]),
        jobUrl: url,
        source: 'Indeed',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to scrape Indeed job posting.', 500);
    }
  },

  async scrapeGlassdoor(url: string): Promise<ScrapedJobData> {
    if (!url.includes('glassdoor.com')) {
      throw new ApiError('Invalid Glassdoor job URL.', 400);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new ApiError(`Failed to fetch Glassdoor page: ${response.status}`, 400);
      }

      const html = await response.text();

      // Try JSON-LD
      const jsonLd = extractJsonLd(html);
      if (jsonLd && jsonLd['@type'] === 'JobPosting') {
        return {
          company: jsonLd.hiringOrganization?.name || '',
          companyLogo: jsonLd.hiringOrganization?.logo || undefined,
          jobTitle: jsonLd.title || '',
          location: jsonLd.jobLocation?.address?.addressLocality || '',
          employmentType: mapEmploymentType(jsonLd.employmentType),
          jobDescription: cleanText(jsonLd.description),
          jobUrl: url,
          source: 'Glassdoor',
        };
      }

      return {
        company: 'Unknown Company',
        jobTitle: 'Unknown Position',
        jobUrl: url,
        source: 'Glassdoor',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to scrape Glassdoor job posting.', 500);
    }
  },

  async scrapeJob(url: string): Promise<ScrapedJobData> {
    const normalizedUrl = url.trim();

    if (normalizedUrl.includes('linkedin.com')) {
      return this.scrapeLinkedIn(normalizedUrl);
    }
    if (normalizedUrl.includes('indeed.com')) {
      return this.scrapeIndeed(normalizedUrl);
    }
    if (normalizedUrl.includes('glassdoor.com')) {
      return this.scrapeGlassdoor(normalizedUrl);
    }

    // Generic fallback - try to extract any JSON-LD job posting
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new ApiError('Failed to fetch the job posting page.', 400);
      }

      const html = await response.text();
      const jsonLd = extractJsonLd(html);

      if (jsonLd && jsonLd['@type'] === 'JobPosting') {
        const salary = jsonLd.baseSalary?.value || {};
        return {
          company: jsonLd.hiringOrganization?.name || 'Unknown Company',
          companyLogo: jsonLd.hiringOrganization?.logo || undefined,
          jobTitle: jsonLd.title || 'Unknown Position',
          location: jsonLd.jobLocation?.address?.addressLocality || '',
          employmentType: mapEmploymentType(jsonLd.employmentType),
          salaryMin: salary.minValue,
          salaryMax: salary.maxValue,
          salaryCurrency: salary.currency,
          jobDescription: cleanText(jsonLd.description),
          jobUrl: normalizedUrl,
          source: new URL(normalizedUrl).hostname.replace('www.', ''),
        };
      }

      // Try to extract title from page
      const titleMatch = html.match(/<title>([^<]+)</i);
      const hostname = new URL(normalizedUrl).hostname.replace('www.', '');

      return {
        company: 'Unknown Company',
        jobTitle: cleanText(titleMatch?.[1])?.split(/[|–-]/)[0]?.trim() || 'Unknown Position',
        jobUrl: normalizedUrl,
        source: hostname,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to scrape job posting. This site may not be supported.', 400);
    }
  },
};
