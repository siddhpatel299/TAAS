import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFile = path.join(__dirname, '../public/version.json');
const packageFile = path.join(__dirname, '../package.json');

// Read current package version
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));

// Generate a build ID based on timestamp
const buildId = new Date().getTime().toString();

const versionData = {
  version: pkg.version,
  buildId: buildId,
  timestamp: new Date().toISOString()
};

// Ensure public directory exists
const publicDir = path.dirname(versionFile);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

console.log(`Updated version.json: ${versionData.version} (Build: ${versionData.buildId})`);
