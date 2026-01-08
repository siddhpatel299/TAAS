import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const CSV_PATH = '/Users/siddh/ASU Dropbox/Siddh Patel/Mac/Downloads/jobs-export-2026-01-07_16-38-25.csv';

// Parse CSV with semicolon delimiter and handle quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function importJobs() {
  const phoneNumber = '+917984462103';
  
  console.log(`Reading CSV file: ${CSV_PATH}`);
  
  // Read full CSV file
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  console.log(`Total lines in CSV: ${lines.length}`);
  
  // Find user by phone number
  console.log(`Looking for user with phone number: ${phoneNumber}`);
  
  const user = await prisma.user.findFirst({
    where: {
      phoneNumber: phoneNumber
    }
  });
  
  if (!user) {
    console.error(`User with phone number ${phoneNumber} not found!`);
    const users = await prisma.user.findMany({
      select: { id: true, phoneNumber: true, username: true, firstName: true }
    });
    console.log('Available users:', users);
    process.exit(1);
  }
  
  console.log(`Found user: ${user.id} (${user.firstName || user.username})`);
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  console.log(`Headers: ${headers.join(', ')}`);
  
  // Find column indices
  const idIdx = headers.indexOf('id');
  const titleIdx = headers.indexOf('title');
  const companyIdx = headers.indexOf('company');
  const locationIdx = headers.indexOf('location');
  const salaryIdx = headers.indexOf('salary');
  const appliedDateIdx = headers.indexOf('applied_date');
  const statusIdx = headers.indexOf('status');
  const notesIdx = headers.indexOf('notes');
  const jobUrlIdx = headers.indexOf('job_url');
  const priorityIdx = headers.indexOf('priority');
  const createdAtIdx = headers.indexOf('created_at');
  const descriptionIdx = headers.indexOf('description');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process in batches
  const BATCH_SIZE = 50;
  const jobs: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    
    const jobTitle = values[titleIdx]?.trim();
    const company = values[companyIdx]?.trim();
    
    if (!jobTitle || !company) {
      console.log(`Skipping line ${i}: missing title or company`);
      skipped++;
      continue;
    }
    
    const location = values[locationIdx]?.trim() || null;
    const appliedDateStr = values[appliedDateIdx]?.trim();
    const appliedDate = appliedDateStr ? new Date(appliedDateStr) : null;
    const status = values[statusIdx]?.trim() || 'applied';
    const priority = values[priorityIdx]?.trim() || 'medium';
    const jobUrl = values[jobUrlIdx]?.trim() || null;
    const createdAtStr = values[createdAtIdx]?.trim();
    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
    
    // Job description is in 'notes' column (user-confirmed mapping)
    let jobDescription = values[notesIdx]?.trim() || values[descriptionIdx]?.trim() || null;
    
    // Clean up the description - remove excessive whitespace
    if (jobDescription) {
      jobDescription = jobDescription.replace(/\r\n/g, '\n').trim();
    }
    
    jobs.push({
      userId: user.id,
      company: company,
      jobTitle: jobTitle,
      location: location,
      status: status,
      priority: priority,
      jobUrl: jobUrl,
      jobDescription: jobDescription,
      appliedDate: appliedDate,
      source: 'CSV Import',
      createdAt: createdAt,
    });
    
    // Process batch
    if (jobs.length >= BATCH_SIZE) {
      const result = await processBatch(jobs, user.id);
      imported += result.imported;
      skipped += result.skipped;
      errors += result.errors;
      jobs.length = 0;
      
      console.log(`Progress: ${i}/${lines.length - 1} lines processed, ${imported} imported, ${skipped} skipped, ${errors} errors`);
    }
  }
  
  // Process remaining
  if (jobs.length > 0) {
    const result = await processBatch(jobs, user.id);
    imported += result.imported;
    skipped += result.skipped;
    errors += result.errors;
  }
  
  console.log(`\n========================================`);
  console.log(`Import complete!`);
  console.log(`Imported: ${imported} jobs`);
  console.log(`Skipped: ${skipped} (duplicates or invalid)`);
  console.log(`Errors: ${errors}`);
  console.log(`========================================`);
}

async function processBatch(jobs: any[], userId: string) {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const job of jobs) {
    try {
      // Check for duplicates
      const existing = await prisma.jobApplication.findFirst({
        where: {
          userId: userId,
          company: job.company,
          jobTitle: job.jobTitle
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await prisma.jobApplication.create({
        data: job
      });
      
      imported++;
    } catch (error: any) {
      console.error(`Error importing ${job.jobTitle} at ${job.company}: ${error.message}`);
      errors++;
    }
  }
  
  return { imported, skipped, errors };
}

importJobs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
