import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const changelogFile = path.join(__dirname, '../src/data/changelog.json');
const REPO = 'siddhpatel299/TAAS';

// Helper to fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TAAS-Changelog-Fetcher', // GitHub requires User-Agent
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    // Add token if available
    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    https.get(url, options, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        // If 404 or other error, resolve with empty array or handle gracefully
        console.warn(`GitHub API returned status: ${res.statusCode} for ${url}`);
        resolve([]); // Return empty list rather than crashing, to respect rate limits etc
        return;
      }

      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function updateChangelog() {
  console.log(`Fetching releases for ${REPO}...`);
  
  try {
    const releases = await fetchJson(`https://api.github.com/repos/${REPO}/releases`);
    
    if (!releases || !Array.isArray(releases) || releases.length === 0) {
      console.log('No GitHub releases found or API error. Keeping existing changelog.');
      return;
    }

    const formattedChangelog = releases.map(release => {
      const date = new Date(release.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Parse body for bullet points to create "changes" array
      // This is a simple heuristic: looks for lines starting with -, *, or +
      const bodyLines = release.body ? release.body.split('\n') : [];
      const changes = [];
      
      let currentSection = 'general';
      
      bodyLines.forEach(line => {
        const cleanLine = line.trim();
        // Skip empty lines
        if (!cleanLine) return;
        
        // Check for headers (## Header)
        if (cleanLine.startsWith('#')) {
            // Could use this to determine type, but for now simple mapping
            return;
        }

        if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
            const content = cleanLine.substring(1).trim();
            changes.push({
                type: 'new', // Default type
                title: content,
                description: '' // Release notes usually just have one line
            });
        }
      });

      // Fallback if no bullet points found
      if (changes.length === 0 && release.body) {
        changes.push({
            type: 'new',
            title: 'Release Notes',
            description: release.body
        });
      }

      return {
        version: release.tag_name,
        date: date,
        title: release.name || release.tag_name,
        description: 'GitHub Release',
        changes: changes
      };
    });

    // Write to file
    fs.writeFileSync(changelogFile, JSON.stringify(formattedChangelog, null, 2));
    console.log(`Successfully updated changelog with ${formattedChangelog.length} releases.`);

  } catch (error) {
    console.error('Error fetching changelog:', error);
  }
}

updateChangelog();
