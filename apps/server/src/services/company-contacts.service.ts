/**
 * Company Contacts Service
 * 
 * Finds email addresses and LinkedIn profiles for company employees using:
 * 1. SERP API - To find LinkedIn profiles via Google search
 * 2. Hunter API - To get one verified email and determine pattern
 * 3. Pattern-based generation - Generate remaining emails using discovered pattern
 * 
 * Features persistent caching of email patterns to minimize Hunter API calls.
 */

import { prisma } from '../lib/prisma';

interface SerpProfile {
  name: string;
  position: string;
  linkedinUrl: string;
  source: string;
}

interface ContactResult {
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  linkedinUrl: string;
  email: string | null;
  emailConfidence: number;
  source: string;
}

interface EmailPattern {
  pattern: string;
  confidence: number;
}

interface CachedEmailPattern extends EmailPattern {
  fromCache: boolean;
  cacheHits?: number;
}

interface SearchOptions {
  mode: 'hr' | 'functional';
  targetRoles: string[];
  location?: string;
  maxResults?: number;
}

// Default HR/Recruiter keywords
const DEFAULT_HR_KEYWORDS = [
  'HR Manager',
  'Recruiter',
  'Talent Acquisition',
  'Human Resources',
  'People Partner',
  'Technical Recruiter',
  'Recruiting Lead',
  'Hiring Manager',
  'People Operations',
];

// Common functional role categories
const FUNCTIONAL_ROLE_SYNONYMS: Record<string, string[]> = {
  'Software Engineer': ['Software Engineer', 'SWE', 'Software Developer', 'Developer', 'Engineer'],
  'Security Engineer': ['Security Engineer', 'Cybersecurity', 'InfoSec', 'Security Analyst', 'SOC Analyst'],
  'Data Scientist': ['Data Scientist', 'ML Engineer', 'Data Engineer', 'Analytics', 'AI Engineer'],
  'Product Manager': ['Product Manager', 'Product Lead', 'PM', 'Product Owner'],
  'DevOps': ['DevOps Engineer', 'SRE', 'Platform Engineer', 'Infrastructure'],
};

// Cache TTL: patterns are valid for 90 days
const CACHE_TTL_DAYS = 90;

export class CompanyContactsService {
  private serpApiKey: string | null;
  private hunterApiKey: string | null;
  // In-memory cache for current session (fast lookup)
  private memoryCache: Map<string, EmailPattern> = new Map();

  constructor(serpApiKey?: string, hunterApiKey?: string) {
    this.serpApiKey = serpApiKey || null;
    this.hunterApiKey = hunterApiKey || null;
  }

  /**
   * Main entry point - Find contacts at a company
   */
  async findCompanyContacts(
    companyName: string,
    options: SearchOptions
  ): Promise<{
    contacts: ContactResult[];
    emailPattern: EmailPattern | null;
    totalFound: number;
    patternFromCache: boolean;
  }> {
    const maxResults = options.maxResults || 10;

    // Step 1: Search for LinkedIn profiles using SERP API
    const profiles = await this.searchLinkedInProfiles(companyName, options);
    
    if (profiles.length === 0) {
      return {
        contacts: [],
        emailPattern: null,
        totalFound: 0,
        patternFromCache: false,
      };
    }

    // Step 2: Get email pattern (from cache or Hunter API)
    const domain = this.extractCompanyDomain(companyName);
    let emailPattern: CachedEmailPattern | null = null;
    let verifiedEmail: string | null = null;

    if (domain) {
      // First, check persistent cache (database)
      emailPattern = await this.getCachedPattern(domain);
      
      // If no cached pattern and we have Hunter API key, discover it
      if (!emailPattern && this.hunterApiKey && profiles.length > 0) {
        const firstProfile = profiles[0];
        const { firstName, lastName } = this.parseFullName(firstProfile.name);
        
        // Get ONE email from Hunter to determine the pattern
        const hunterResult = await this.getEmailFromHunter(firstName, lastName, domain);
        
        if (hunterResult.email) {
          verifiedEmail = hunterResult.email;
          const extractedPattern = this.extractEmailPattern(hunterResult.email, firstName, lastName);
          emailPattern = { ...extractedPattern, fromCache: false };
          
          // Save to persistent cache
          await this.savePatternToCache(domain, extractedPattern, hunterResult.email);
        } else {
          // Try domain search to discover pattern
          const discoveredPattern = await this.discoverEmailPatternFromApi(domain);
          if (discoveredPattern) {
            emailPattern = { ...discoveredPattern, fromCache: false };
            await this.savePatternToCache(domain, discoveredPattern);
          }
        }
      }
    }

    // Step 3: Generate emails for all profiles using the pattern
    const contacts: ContactResult[] = profiles.slice(0, maxResults).map((profile, index) => {
      const { firstName, lastName } = this.parseFullName(profile.name);
      
      let email: string | null = null;
      let emailConfidence = 0;

      // First profile gets the verified email (if we just discovered the pattern)
      if (index === 0 && verifiedEmail && !emailPattern?.fromCache) {
        email = verifiedEmail;
        emailConfidence = 95;
      } else if (emailPattern && domain) {
        // Generate email using pattern
        email = this.generateEmailFromPattern(firstName, lastName, domain, emailPattern);
        // Cached patterns have slightly higher confidence (proven over time)
        emailConfidence = emailPattern.fromCache 
          ? emailPattern.confidence * 0.9 
          : emailPattern.confidence * 0.85;
      }

      return {
        name: profile.name,
        firstName,
        lastName,
        position: profile.position,
        linkedinUrl: profile.linkedinUrl,
        email,
        emailConfidence: Math.round(emailConfidence),
        source: profile.source,
      };
    });

    return {
      contacts,
      emailPattern: emailPattern ? { pattern: emailPattern.pattern, confidence: emailPattern.confidence } : null,
      totalFound: profiles.length,
      patternFromCache: emailPattern?.fromCache ?? false,
    };
  }

  /**
   * Get cached email pattern from database
   */
  private async getCachedPattern(domain: string): Promise<CachedEmailPattern | null> {
    // Check in-memory cache first (fastest)
    const memoryCached = this.memoryCache.get(domain);
    if (memoryCached) {
      return { ...memoryCached, fromCache: true };
    }

    try {
      const cached = await prisma.emailPatternCache.findUnique({
        where: { domain },
      });

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      const cacheAge = Date.now() - cached.updatedAt.getTime();
      const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
      
      if (cacheAge > maxAge) {
        // Cache expired, delete it
        await prisma.emailPatternCache.delete({ where: { domain } });
        return null;
      }

      // Update hit count (fire and forget)
      prisma.emailPatternCache.update({
        where: { domain },
        data: { hitCount: { increment: 1 } },
      }).catch(() => {}); // Ignore errors

      const pattern: CachedEmailPattern = {
        pattern: cached.pattern,
        confidence: cached.confidence,
        fromCache: true,
        cacheHits: cached.hitCount,
      };

      // Store in memory cache for fast subsequent lookups
      this.memoryCache.set(domain, { pattern: pattern.pattern, confidence: pattern.confidence });

      console.log(`📦 Cache HIT for ${domain} (${cached.hitCount} total hits)`);
      return pattern;
    } catch (error) {
      console.error('Failed to read from pattern cache:', error);
      return null;
    }
  }

  /**
   * Save email pattern to persistent cache
   */
  private async savePatternToCache(
    domain: string, 
    pattern: EmailPattern, 
    sampleEmail?: string
  ): Promise<void> {
    try {
      await prisma.emailPatternCache.upsert({
        where: { domain },
        create: {
          domain,
          pattern: pattern.pattern,
          confidence: pattern.confidence,
          sampleEmail,
          hitCount: 1,
        },
        update: {
          pattern: pattern.pattern,
          confidence: pattern.confidence,
          sampleEmail: sampleEmail || undefined,
          hitCount: { increment: 1 },
        },
      });

      // Update memory cache
      this.memoryCache.set(domain, pattern);
      
      console.log(`💾 Cached pattern for ${domain}: ${pattern.pattern}`);
    } catch (error) {
      console.error('Failed to save pattern to cache:', error);
    }
  }

  /**
   * Search LinkedIn profiles using SERP API
   */
  private async searchLinkedInProfiles(
    companyName: string,
    options: SearchOptions
  ): Promise<SerpProfile[]> {
    if (!this.serpApiKey) {
      console.warn('SERP API key not configured');
      return [];
    }

    const maxResults = options.maxResults || 10;
    const query = this.buildSearchQuery(companyName, options);

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: this.serpApiKey,
        num: Math.min(maxResults * 2, 20).toString(), // Get more results to filter
      });

      const response = await fetch(`https://serpapi.com/search?${params}`);
      
      if (!response.ok) {
        console.error(`SERP API error: ${response.status}`);
        return [];
      }

      const data = await response.json() as { organic_results?: any[] };
      const results = data.organic_results || [];

      const profiles: SerpProfile[] = [];
      
      for (const result of results) {
        const profile = this.parseProfileFromResult(result);
        if (profile && profiles.length < maxResults) {
          profiles.push(profile);
        }
      }

      return this.deduplicateProfiles(profiles);
    } catch (error) {
      console.error('SERP API search failed:', error);
      return [];
    }
  }

  /**
   * Build Google search query for finding company profiles
   */
  private buildSearchQuery(companyName: string, options: SearchOptions): string {
    const roles = options.mode === 'hr' 
      ? (options.targetRoles.length > 0 ? options.targetRoles : DEFAULT_HR_KEYWORDS)
      : options.targetRoles;

    // Build role clause
    const roleClause = roles
      .map(role => `"${role.replace(/"/g, '')}"`)
      .join(' OR ');

    // Build query
    let query = `site:linkedin.com/in "${companyName}" (${roleClause})`;

    // Add location filter if provided
    if (options.location) {
      query += ` "${options.location}"`;
    }

    return query;
  }

  /**
   * Parse a search result into a profile
   */
  private parseProfileFromResult(result: any): SerpProfile | null {
    const title = result?.title || '';
    const link = result?.link || '';

    // Only consider LinkedIn profiles
    if (!link.includes('linkedin.com/in')) {
      return null;
    }

    // Parse name from title (format: "Name - Position at Company | LinkedIn")
    const parts = title.split(' - ');
    const name = parts[0]?.trim();
    
    if (!name || name.length < 2) {
      return null;
    }

    // Extract position from remaining parts
    let position = 'Unknown Position';
    if (parts.length > 1) {
      const positionPart = parts.slice(1).join(' - ');
      // Remove "| LinkedIn" suffix if present
      position = positionPart.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
      // Also handle "at Company" pattern
      const atIndex = position.toLowerCase().indexOf(' at ');
      if (atIndex > 0) {
        position = position.substring(0, atIndex).trim();
      }
    }

    return {
      name,
      position,
      linkedinUrl: link,
      source: 'linkedin',
    };
  }

  /**
   * Get email from Hunter API (single API call)
   */
  private async getEmailFromHunter(
    firstName: string,
    lastName: string,
    domain: string
  ): Promise<{ email: string | null; confidence: number }> {
    if (!this.hunterApiKey) {
      return { email: null, confidence: 0 };
    }

    try {
      const params = new URLSearchParams({
        domain,
        first_name: firstName,
        last_name: lastName,
        api_key: this.hunterApiKey,
      });

      const response = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
      
      if (!response.ok) {
        console.error(`Hunter API error: ${response.status}`);
        return { email: null, confidence: 0 };
      }

      const data = await response.json() as { data?: { email?: string; confidence?: number } };
      const emailData = data.data || {};

      return {
        email: emailData.email || null,
        confidence: emailData.confidence || 0,
      };
    } catch (error) {
      console.error('Hunter API call failed:', error);
      return { email: null, confidence: 0 };
    }
  }

  /**
   * Discover email pattern using Hunter domain search API
   * This is called only when no cached pattern exists
   */
  private async discoverEmailPatternFromApi(domain: string): Promise<EmailPattern | null> {
    if (!this.hunterApiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        domain,
        api_key: this.hunterApiKey,
      });

      const response = await fetch(`https://api.hunter.io/v2/domain-search?${params}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as { data?: { emails?: any[] } };
      const emails = data.data?.emails || [];
      
      if (emails.length === 0) {
        return null;
      }

      // Analyze emails to determine pattern
      return this.analyzeEmailPattern(emails);
    } catch (error) {
      console.error('Hunter domain search failed:', error);
      return null;
    }
  }

  /**
   * Analyze emails to determine the most common pattern
   */
  private analyzeEmailPattern(emails: any[]): EmailPattern {
    const patterns = new Map<string, number>();
    
    emails.forEach(emailData => {
      const email = emailData.value;
      const firstName = emailData.first_name;
      const lastName = emailData.last_name;
      
      if (email && firstName && lastName) {
        const pattern = this.extractEmailPattern(email, firstName, lastName).pattern;
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    });

    if (patterns.size === 0) {
      return { pattern: '{first}.{last}@{domain}', confidence: 50 };
    }

    // Get most common pattern
    const sorted = Array.from(patterns.entries()).sort((a, b) => b[1] - a[1]);
    const mostCommon = sorted[0];

    return {
      pattern: mostCommon[0],
      confidence: Math.min((mostCommon[1] / emails.length) * 100, 95),
    };
  }

  /**
   * Extract email pattern from a known email
   */
  private extractEmailPattern(email: string, firstName: string, lastName: string): EmailPattern {
    const [localPart] = email.split('@');
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const f = first[0] || '';
    const l = last[0] || '';

    // Check various patterns
    if (localPart === `${first}.${last}`) return { pattern: '{first}.{last}@{domain}', confidence: 95 };
    if (localPart === `${first}${last}`) return { pattern: '{first}{last}@{domain}', confidence: 95 };
    if (localPart === `${first}_${last}`) return { pattern: '{first}_{last}@{domain}', confidence: 95 };
    if (localPart === `${f}${last}`) return { pattern: '{f}{last}@{domain}', confidence: 95 };
    if (localPart === `${first}${l}`) return { pattern: '{first}{l}@{domain}', confidence: 95 };
    if (localPart === `${last}.${first}`) return { pattern: '{last}.{first}@{domain}', confidence: 95 };
    if (localPart === `${f}.${last}`) return { pattern: '{f}.{last}@{domain}', confidence: 95 };
    if (localPart === first) return { pattern: '{first}@{domain}', confidence: 90 };
    if (localPart === `${first}-${last}`) return { pattern: '{first}-{last}@{domain}', confidence: 95 };
    
    // Default fallback
    return { pattern: '{first}.{last}@{domain}', confidence: 60 };
  }

  /**
   * Generate email from pattern
   */
  private generateEmailFromPattern(
    firstName: string,
    lastName: string,
    domain: string,
    pattern: EmailPattern
  ): string {
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const f = first[0] || '';
    const l = last[0] || '';

    return pattern.pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', f)
      .replace('{l}', l)
      .replace('{domain}', domain);
  }

  /**
   * Extract company domain from name
   */
  private extractCompanyDomain(companyName: string): string {
    // Common domain mappings for well-known companies
    const knownDomains: Record<string, string> = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com',
      'apple': 'apple.com',
      'netflix': 'netflix.com',
      'uber': 'uber.com',
      'airbnb': 'airbnb.com',
      'linkedin': 'linkedin.com',
      'twitter': 'x.com',
      'salesforce': 'salesforce.com',
    };

    const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (knownDomains[normalized]) {
      return knownDomains[normalized];
    }

    // Generate domain from company name
    const cleanName = companyName
      .toLowerCase()
      .replace(/\s+(inc|llc|corp|ltd|limited|co|company)\.?$/i, '')
      .replace(/[^a-z0-9]/g, '');
    
    return `${cleanName}.com`;
  }

  /**
   * Parse full name into first and last name
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    
    // Handle common name formats
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    return { firstName, lastName };
  }

  /**
   * Remove duplicate profiles
   */
  private deduplicateProfiles(profiles: SerpProfile[]): SerpProfile[] {
    const seen = new Set<string>();
    return profiles.filter(profile => {
      const key = profile.linkedinUrl || `${profile.name}-${profile.position}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get expanded role keywords for functional search
   */
  static getExpandedRoles(role: string): string[] {
    const normalized = role.trim();
    
    // Check if this matches any known category
    for (const [category, synonyms] of Object.entries(FUNCTIONAL_ROLE_SYNONYMS)) {
      if (synonyms.some(s => s.toLowerCase() === normalized.toLowerCase())) {
        return synonyms;
      }
    }
    
    // Return the role as-is if no match
    return [normalized];
  }

  /**
   * Get default HR roles
   */
  static getDefaultHRRoles(): string[] {
    return [...DEFAULT_HR_KEYWORDS];
  }

  /**
   * Clear cached pattern for a domain (useful if pattern becomes invalid)
   */
  static async clearCachedPattern(domain: string): Promise<boolean> {
    try {
      await prisma.emailPatternCache.delete({
        where: { domain },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalPatterns: number;
    totalHits: number;
    topDomains: { domain: string; hits: number }[];
  }> {
    const patterns = await prisma.emailPatternCache.findMany({
      orderBy: { hitCount: 'desc' },
      take: 10,
    });

    const totalPatterns = await prisma.emailPatternCache.count();
    const totalHits = patterns.reduce((sum, p) => sum + p.hitCount, 0);

    return {
      totalPatterns,
      totalHits,
      topDomains: patterns.map(p => ({ domain: p.domain, hits: p.hitCount })),
    };
  }
}

export const companyContactsService = new CompanyContactsService();
