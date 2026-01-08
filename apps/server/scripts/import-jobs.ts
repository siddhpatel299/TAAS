import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// CSV data from the export file
const csvData = `id;user_id;title;company;location;salary;applied_date;status;notes;job_url;priority;created_at;updated_at;deadline;interview_date;description
ed8c3907-77fb-4827-8559-9699153630ba;39329dc6-d328-40db-bfe3-359e01f97019;Software Engineer Asc;Lockheed Martin;;;2025-12-15;applied;Software Engineer Asc - Space - Colorado - IGNITE Innovation Convergence team;;medium;2025-12-15 20:43:22.402755+00;2025-12-15 20:43:22.402755+00;;;
61a2c0a0-a1a3-4f34-a8a2-fb0f0207bc03;39329dc6-d328-40db-bfe3-359e01f97019;Application Security Engineer;Sepal AI;United States;;2025-08-27;applied;Red teaming AI, offensive security, CTF experience required;;medium;2025-08-27 01:06:16.668488+00;2025-08-27 01:06:16.668488+00;;;
b8b3b1ce-111b-480c-b9e3-ceea163376fe;39329dc6-d328-40db-bfe3-359e01f97019;Cyber Software Engineer;Leidos;;;2025-11-12;applied;Unmanned and autonomous ships software development;;medium;2025-11-12 14:40:43.729202+00;2025-11-12 14:40:43.729202+00;;;
7a1ebd25-4e85-4ff9-8d22-6fe2613db217;39329dc6-d328-40db-bfe3-359e01f97019;Cyber Security Analyst;Aquent;Phoenix, AZ;;2025-11-12;applied;Security Operations Analyst - Data Protection team;;medium;2025-11-12 15:45:42.596461+00;2025-11-12 15:45:42.596461+00;;;
92e95614-b7a8-481c-a07b-0723652c76bd;39329dc6-d328-40db-bfe3-359e01f97019;GRC Analyst;Concord Servicing;Scottsdale, AZ;;2025-12-16;applied;Entry-level GRC Analyst - governance, risk management, compliance;;low;2025-12-16 21:50:02.876913+00;2025-12-16 21:50:02.876913+00;;;
1bf56fc6-ab76-4b34-8469-48015ab197f4;39329dc6-d328-40db-bfe3-359e01f97019;Information Security Intern (Graduate);Genmab;Princeton, NJ;;2025-12-04;applied;Application Security Intern - MCP server development;;medium;2025-12-05 04:54:42.234414+00;2025-12-05 04:54:42.234414+00;;;
d2f8d43e-0639-4afe-abee-ee179c6ddb9c;39329dc6-d328-40db-bfe3-359e01f97019;OPERATIONS ANALYST I, IS&T IT Help Center;Boston University;Boston, MA;;2025-11-12;applied;IT Operations Analyst - Service Desk Support;;medium;2025-11-12 15:54:46.569726+00;2025-11-12 15:54:46.569726+00;;;
ae873d4d-c488-4a5a-b61a-500c37c11bb1;39329dc6-d328-40db-bfe3-359e01f97019;Jr. Cybersecurity Engineer;Seneca Resources;New York, NY;;2025-11-17;applied;Endpoint security, vulnerability management;;low;2025-11-18 00:53:27.28235+00;2025-11-18 00:53:27.28235+00;;;
5deb5f11-6f7d-43a3-890c-ea5ae706206c;39329dc6-d328-40db-bfe3-359e01f97019;Cybersecurity roles;MCS Group - USA;United States;;2025-12-05;applied;Building pipeline for Q1 cybersecurity roles;;low;2025-12-05 17:25:51.67735+00;2025-12-05 17:25:51.67735+00;;;
8a6ca589-c623-4e86-99f6-b3c56cc5c8e1;39329dc6-d328-40db-bfe3-359e01f97019;Security Engineer;Anaconda, Inc.;United States;;2025-12-17;applied;Security Engineering - cloud infrastructure, applications;;medium;2025-12-17 14:46:46.096247+00;2025-12-17 14:46:46.096247+00;;;
9815fe07-a8c0-43a1-afdb-75f6e1e7bc93;39329dc6-d328-40db-bfe3-359e01f97019;Information Security Engineer, Internship;Palantir;New York, NY;;2025-09-03;applied;Information Security Intern - high impact security projects;;high;2025-09-04 19:59:09.005318+00;2025-09-04 20:26:39.274596+00;;;
e675cc61-46d6-4474-a790-e17a3b0a39be;39329dc6-d328-40db-bfe3-359e01f97019;Systems Application Support - Entry Level;Visa;Ashburn, VA;;2025-12-02;applied;Entry-Level Systems Application Support analyst;;medium;2025-12-03 04:14:33.857951+00;2025-12-03 04:14:33.857951+00;;;`;

// Full job descriptions from CSV
const jobDescriptions: Record<string, string> = {
  "ed8c3907-77fb-4827-8559-9699153630ba": `Software Engineer Asc
Space

Colorado

713058BR

Basic Qualifications

• Background in a software or technical field
• Familiarity with the software development lifecycle
• Knowledge of or experience in Agile Methodologies
• Software Engineering experiences or education using Python/Go/C++/Java or Object Oriented

This position is for a Software Engineer on our IGNITE Innovation Convergence team responsible for designing and developing innovative software solutions. Initial projects within this position's portfolio include mission orchestration and distributed compute with wide impact across the business.

Roles and responsibilities include:
• Evaluating, rapidly pilot then develop and implement new technology
• Working in an agile and DevSecOps environment
• Partnering with peers and internal stakeholders to shape project requirements
• Collaborating with project managers and development team

Desired skills:
• Results driven, strong problem-solving/out of the box thinking skills
• Software Engineering knowledge using Python/Go/C++/Java or Object Oriented
• Experience in Services, Micro-Services, Software Factories, DevSecOps, Cloud and Service Oriented Architectures
• Experience with Cybersecurity for software products

Ability to work remotely: Full-time Remote Telework
Pay Range: $62,700 - $110,630 (base), $72,200 - $125,005 (premium metros)`,

  "61a2c0a0-a1a3-4f34-a8a2-fb0f0207bc03": `Sepal AI is hiring contributors to help build the world's most advanced benchmark for red-teaming AI.

🧠 What You'll Do
- Identify real-world vulnerabilities across OS, web, app, and cloud stacks
- Generate simulations, exploits, and patches that demonstrate key vulnerabilities
- Author static analysis rules to detect weaknesses
- Patch bugs in vulnerable source code
- Collaborate with engineers to design new challenges

✅ Who You Are
- A security engineer with 3+ years in offensive security
- Have worked in application security, secure compiler teams, or static analysis platforms
- Track record in CTF challenges, or experience in enterprise offensive security
- Comfortable with Python and Bash

💸 Compensation: $50–100/hr based on experience and location
⏱ Flexible hours`,

  "b8b3b1ce-111b-480c-b9e3-ceea163376fe": `Leidos is seeking an experienced Cyber Software Engineer to join our team in developing unmanned and autonomous ships for the US Government.

Primary Responsibilities:
- Design, develop, and debug mission critical software source code
- Participate in the full software development lifecycle
- Serve as technical team member to support troubleshooting and problem solving
- Perform peer reviews of software
- Assist with evaluating field tests
- Travel (up to 25%)

Basic Qualifications:
- Bachelor's degree in Computer Science or STEM field plus 2+ years of software development
- Experience with Security Technical Implementation Guides (STIGs) and RHEL
- Experience with DevSecOps and cyber security
- Ability to obtain and maintain a Secret Security Clearance

Pay Range: $67,600.00 - $122,200.00`,

  "7a1ebd25-4e85-4ff9-8d22-6fe2613db217": `Security Operations Analyst - Data Protection team

What You'll Do:
- Deliver essential data security operational processes, focusing on database activity monitoring
- Participate in monitoring, analyzing, and responding to information security risks
- Support the broader security operations, risk management, and engineering teams
- Collaborate with cross-functional teams

Must-Have Qualifications:
- Bachelor's degree in computer science or a closely related field
- Excellent organizational skills with the ability to maintain detailed documentation
- Proven ability to build trusted relationships with peers and cross-functional teams

Nice-to-Have:
- Relevant professional certification (e.g., CISA, CISSP, CIA)
- Minimum of 1 year of security experience
- Familiarity with core Data Protection concepts including Data Loss Prevention, Encryption
- Experience with scripting languages such as Python, SQL, and/or PowerShell`,

  "92e95614-b7a8-481c-a07b-0723652c76bd": `Entry-level GRC Analyst position at Concord Servicing.

Key Responsibilities:
- Assist in the development, implementation, and monitoring of Third Party Risk Management program
- Monitor and support documented risks, the risk register, and risk reviews
- Support the maintenance and enhancement of policies and procedures
- Conduct risk assessments and identify areas for improvement
- Collaborate with cross-functional teams to ensure compliance

Requirements:
- Strong understanding of regulatory compliance and risk management principles
- Ability to communicate effectively with all levels of the organization
- Strong attention to detail and organizational skills
- Strong analytical and problem-solving skills

Benefits: Health Care Plan, Retirement Plan (401k, IRA), Life Insurance, Paid Time Off, Family Leave`,

  "1bf56fc6-ab76-4b34-8469-48015ab197f4": `Information Security Intern (Graduate) at Genmab

Job Overview:
Assist in architecting and developing a secure MCP server aligned to Genmab's AI security principles. Support the Application Security team in designing and implementing a Model Context Protocol (MCP) server.

What You'll Do:
- Research and apply security standards (e.g., NIST SSDF, OWASP ASVS, CSA AI guidelines)
- Prototype, test, and validate secure communication workflows between human users and AI agents
- Evaluate risks associated with cross-agent communication, identity, and authorization
- Document architecture decisions, security controls, and implementation patterns

Required Qualifications:
- Currently enrolled in a Master's or PhD program in Computer Science, Cybersecurity
- Strong foundational knowledge of application security, secure software design
- Experience with Python, TypeScript, or similar languages
- Understanding of authentication/authorization models (OAuth, mTLS, API security patterns)

Internship: June – August 2026, Princeton, New Jersey (Hybrid)`,

  "d2f8d43e-0639-4afe-abee-ee179c6ddb9c": `Operations Analyst I - IS&T IT Help Center at Boston University

You Will:
- Leverage technical expertise and logical problem-solving skills
- Provide advanced level support for various client-impacting technologies
- Serve as subject matter expert for many technology concepts, applications, systems, and services

Required Skills:
- Bachelor's degree required and 1-3 years of experience
- Intermediate troubleshooting skills for common operating systems, mobile devices
- Experience with analytical tools in a complex enterprise environment

Position: Full onsite, may entail being on call and working evening, weekend and/or holiday hours
Salary: $60,000.00 - $66,000.00`,

  "ae873d4d-c488-4a5a-b61a-500c37c11bb1": `Jr. Cybersecurity Engineer at Seneca Resources

Location: New York, NY (Onsite)
Contract: 7+ months
Pay Rate: $50-$57/hour

Key Responsibilities:
- Endpoint Security Deployment & Management with AV and EDR solutions
- Vulnerability Management - conduct regular scans and assessments
- Cyber Asset Attack Surface Management (CAASM)
- Incident Response & Threat Hunting
- Perform investigation using SIEM tool such as Splunk

Requirements:
- Bachelor's degree in Computer Science, Cybersecurity
- 3+ years of experience in cybersecurity engineering with focus on endpoint security
- Hands-on experience with AV and EDR platforms (CrowdStrike, SentinelOne, Microsoft Defender)`,

  "5deb5f11-6f7d-43a3-890c-ea5ae706206c": `MCS Group - USA Cybersecurity Talent Pool for Q1

We work with growing startups, mid-sized organizations, and established enterprise teams across EST and CST regions.

Roles we support:
- Security Analysts (Tier 1, 2, 3)
- SOC Analysts / Engineers
- Incident Response
- Threat Intelligence
- Governance, Risk & Compliance (GRC)
- Security Engineering
- Cloud Security
- IAM / PAM Specialists
- Penetration Testers / Offensive Security
- Vulnerability Management
- Security Architects
- Blue Team, Red Team, Purple Team roles

Common stacks: SIEM tools (Splunk, Sentinel, QRadar), EDR solutions, AWS/Azure/GCP Security`,

  "8a6ca589-c623-4e86-99f6-b3c56cc5c8e1": `Security Engineer at Anaconda, Inc.

What You'll Do:
- Conduct security assessments and penetration testing across cloud infrastructure
- Monitor, triage, and respond to security alerts and incidents
- Partner with development teams to embed security into the SDLC
- Drive adoption of security tooling and automation
- Support identity, access management, and compliance initiatives (ISO 27001, SOC 2, GDPR)

What You'll Need:
- 3+ years of experience in product security, application security, or cloud security
- Experience with security tools including vulnerability scanners, SIEM platforms
- Working knowledge of cloud platforms (AWS, Azure, or GCP) and Kubernetes/Docker
- Proficiency in Python, Bash, or Go for security automation

Salary Range: $120,000 - $176,500 with annual bonus potential and equity`,

  "9815fe07-a8c0-43a1-afdb-75f6e1e7bc93": `Information Security Engineer Internship at Palantir

The Role:
Information Security's mission is to secure Palantir, and by extension, protect our customers and their critical data. You'll design, architect, and drive security posture changes for Palantir.

Core Responsibilities:
- Impact: Address meaningful and exciting projects that change the security of Palantir
- Ownership: See projects through from beginning to end
- Collaboration: Work internally with people from a variety of backgrounds
- Growth: Seek new challenges and opportunities for growth

What We Require:
- Engineering background in Computer Science, Mathematics, Software Engineering
- Eligibility and willingness to obtain a US Security clearance
- Experience coding in Python, Java, C++, JavaScript, or similar languages
- Must be planning on graduating in 2027

Salary: $10,500/month`,

  "e675cc61-46d6-4474-a790-e17a3b0a39be": `Systems Application Support - Entry Level at Visa

Day to Day:
- Develop an in-depth understanding of VOCC functionality, product, and services
- Develop, edit, and distribute effective internal and external communication
- Follow documented support procedures, managing each issue through resolution
- Track, update and resolve all assigned incidents in the incident management system
- Liaise with L2 support groups to collaborate on the resolution of incidents

Basic Qualifications:
- High School diploma or equivalent or relevant work experience

Preferred:
- 2 or more years of work experience
- PC proficient, MS Office suite familiarity
- Previous IT Operations/Service Desk experience
- Basic knowledge of AI concepts and/or Python, Java, or SQL

Salary: $58,300.00 to $80,200.00 USD per year
Location: Ashburn, VA (On-site)`
};

async function importJobs() {
  const phoneNumber = '+917984462103';
  
  console.log(`Looking for user with phone number: ${phoneNumber}`);
  
  // Find user by phone number
  const user = await prisma.user.findFirst({
    where: {
      phoneNumber: phoneNumber
    }
  });
  
  if (!user) {
    console.error(`User with phone number ${phoneNumber} not found!`);
    
    // List available users
    const users = await prisma.user.findMany({
      select: { id: true, phoneNumber: true, username: true, firstName: true }
    });
    console.log('Available users:', users);
    
    process.exit(1);
  }
  
  console.log(`Found user: ${user.id} (${user.firstName || user.username})`);
  
  // Parse CSV data
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(';');
  
  let imported = 0;
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const row: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    const oldId = row['id'];
    const jobTitle = row['title'];
    const company = row['company'];
    const location = row['location'] || null;
    const appliedDate = row['applied_date'] ? new Date(row['applied_date']) : null;
    const status = row['status'] || 'applied';
    const priority = row['priority'] || 'medium';
    const jobUrl = row['job_url'] || null;
    const createdAt = row['created_at'] ? new Date(row['created_at']) : new Date();
    
    // Get full job description
    const jobDescription = jobDescriptions[oldId] || row['notes'] || null;
    
    // Check if job already exists (by company + title for this user)
    const existing = await prisma.jobApplication.findFirst({
      where: {
        userId: user.id,
        company: company,
        jobTitle: jobTitle
      }
    });
    
    if (existing) {
      console.log(`Skipping duplicate: ${jobTitle} at ${company}`);
      skipped++;
      continue;
    }
    
    // Create job application
    try {
      await prisma.jobApplication.create({
        data: {
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
        }
      });
      
      console.log(`✓ Imported: ${jobTitle} at ${company}`);
      imported++;
    } catch (error) {
      console.error(`✗ Failed to import ${jobTitle} at ${company}:`, error);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Import complete!`);
  console.log(`Imported: ${imported} jobs`);
  console.log(`Skipped: ${skipped} duplicates`);
  console.log(`========================================`);
}

importJobs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
