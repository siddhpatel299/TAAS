/**
 * Email Outreach Service
 * 
 * Handles cold email outreach with:
 * - Gmail API integration for sending emails
 * - OpenAI integration for generating personalized emails
 * - Support for file attachments
 * - Personalization using user's resume
 */

import { google } from 'googleapis';
import OpenAI from 'openai';

interface ContactForEmail {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  company: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isAiGenerated?: boolean;
}

interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

interface EmailSendResult {
  success: boolean;
  email: string;
  name: string;
  error?: string;
  messageId?: string;
}

interface GenerateEmailOptions {
  recipientName: string;
  recipientPosition: string;
  company: string;
  jobTitle: string;
  resumeText: string;
  tone?: 'professional' | 'friendly' | 'casual';
  purpose?: 'referral' | 'introduction' | 'follow-up' | 'cold-outreach';
}

// Default email templates
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'referral-request',
    name: 'Referral Request',
    subject: 'Quick Question About {company}',
    body: `Hi {firstName},

I hope this message finds you well! I came across your profile while researching {company} and noticed your role as {position}.

I'm currently exploring opportunities in the {jobTitle} space and would love to learn more about your experience at {company}. Would you be open to a brief chat or could you point me in the right direction for open positions?

I'd really appreciate any insights you could share.

Best regards,
{senderName}`,
  },
  {
    id: 'cold-introduction',
    name: 'Cold Introduction',
    subject: 'Passionate {jobTitle} - Interested in {company}',
    body: `Hi {firstName},

I'm reaching out because I'm genuinely excited about the work {company} is doing, and I believe my background could be a great fit.

As a {jobTitle} with experience in {skills}, I'm particularly drawn to {company}'s approach to innovation in the industry.

I'd love the opportunity to discuss how I might contribute to your team. Would you be open to a quick conversation?

Thank you for your time!

Best,
{senderName}`,
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    subject: 'Following Up - {jobTitle} Opportunity',
    body: `Hi {firstName},

I wanted to follow up on my previous message regarding opportunities at {company}.

I remain very interested in contributing to your team and would welcome the chance to discuss how my skills align with your needs.

Please let me know if there's a good time to connect.

Thank you,
{senderName}`,
  },
];

export class EmailOutreachService {
  private gmailTokens: GmailTokens | null = null;
  private openai: OpenAI | null = null;
  private userEmail: string | null = null;

  constructor(
    gmailTokens?: GmailTokens,
    openaiApiKey?: string,
    userEmail?: string
  ) {
    if (gmailTokens) {
      this.gmailTokens = gmailTokens;
    }
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
    if (userEmail) {
      this.userEmail = userEmail;
    }
  }

  /**
   * Get default email templates
   */
  static getDefaultTemplates(): EmailTemplate[] {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Generate personalized email using OpenAI
   */
  async generatePersonalizedEmail(options: GenerateEmailOptions): Promise<{
    subject: string;
    body: string;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const toneDescription = {
      professional: 'professional and formal',
      friendly: 'warm and approachable while remaining professional',
      casual: 'casual and conversational',
    };

    const purposeDescription = {
      referral: 'requesting a referral for a job position',
      introduction: 'introducing myself and expressing interest in the company',
      'follow-up': 'following up on a previous conversation or application',
      'cold-outreach': 'reaching out cold to explore opportunities',
    };

    const prompt = `Generate a personalized cold outreach email for a job seeker.

CONTEXT (for understanding, but use placeholders in output):
- Target recipient position: ${options.recipientPosition}
- Company: ${options.company}
- Target Role: ${options.jobTitle}
- Job seeker background:
${options.resumeText.substring(0, 2000)}

REQUIREMENTS:
- Tone: ${toneDescription[options.tone || 'professional']}
- Purpose: ${purposeDescription[options.purpose || 'cold-outreach']}
- Keep it concise (under 200 words)
- Be genuine and specific (reference the company and role type)
- Include a clear call-to-action

IMPORTANT - USE THESE PLACEHOLDERS (they will be replaced for each recipient):
- Use {firstName} for the recipient's first name (e.g., "Dear {firstName},")
- Use {lastName} for recipient's last name
- Use {position} for recipient's job title
- Use {company} for company name (already "${options.company}")
- Do NOT use actual names - the email may be sent to multiple people

Return JSON format:
{
  "subject": "Email subject line (can include {company})",
  "body": "Email body starting with 'Dear {firstName},' and using placeholders"
}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach helping job seekers write effective cold outreach emails. Generate concise, personalized emails that get responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Failed to generate email');
    }

    const result = JSON.parse(content);
    return {
      subject: result.subject,
      body: result.body,
    };
  }

  /**
   * Apply template variables to email
   */
  applyTemplateVariables(
    template: { subject: string; body: string },
    variables: Record<string, string>
  ): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { subject, body };
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments: Array<{ filename: string; content: string; mimeType: string }> = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.gmailTokens) {
      return { success: false, error: 'Gmail not connected' };
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`
      );

      oauth2Client.setCredentials({
        access_token: this.gmailTokens.accessToken,
        refresh_token: this.gmailTokens.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Build email content
      let emailContent: string;

      if (attachments.length > 0) {
        // Multipart email with attachments
        const boundary = 'boundary_' + Math.random().toString(36).substring(2);
        const emailParts = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: 7bit',
          '',
          this.convertToHtml(body),
          '',
        ];

        // Add attachments
        for (const attachment of attachments) {
          emailParts.push(
            `--${boundary}`,
            `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            '',
            attachment.content, // Already base64 encoded
            ''
          );
        }

        emailParts.push(`--${boundary}--`);
        emailContent = emailParts.join('\r\n');
      } else {
        // Simple HTML email
        emailContent = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          '',
          this.convertToHtml(body),
        ].join('\r\n');
      }

      // Encode for Gmail API
      const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`Email sent to ${to}, messageId: ${result.data.id}`);
      return { success: true, messageId: result.data.id || undefined };
    } catch (error: any) {
      console.error(`Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk emails to multiple contacts
   */
  async sendBulkEmails(
    contacts: ContactForEmail[],
    emailTemplate: { subject: string; body: string },
    senderName: string,
    attachments: Array<{ filename: string; content: string; mimeType: string }> = [],
    delayMs: number = 2000
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];

    for (const contact of contacts) {
      if (!contact.email) {
        results.push({
          success: false,
          email: '',
          name: contact.name,
          error: 'No email address',
        });
        continue;
      }

      // Apply personalization
      const personalized = this.applyTemplateVariables(emailTemplate, {
        firstName: contact.firstName,
        lastName: contact.lastName,
        name: contact.name,
        position: contact.position,
        company: contact.company,
        senderName: senderName,
        jobTitle: '', // Will be filled by caller
      });

      const result = await this.sendEmail(
        contact.email,
        personalized.subject,
        personalized.body,
        attachments
      );

      results.push({
        success: result.success,
        email: contact.email,
        name: contact.name,
        error: result.error,
        messageId: result.messageId,
      });

      // Delay between emails to avoid rate limiting
      if (contacts.indexOf(contact) < contacts.length - 1) {
        await this.delay(delayMs);
      }
    }

    return results;
  }

  /**
   * Convert plain text to HTML
   */
  private convertToHtml(text: string): string {
    // Convert line breaks to HTML
    const htmlBody = text
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    p { margin: 0 0 1em 0; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get Gmail OAuth URL
   */
  static getGmailAuthUrl(state?: string): string {
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
      redirect_uri: redirectUri, // Explicitly include redirect_uri
    });
  }

  /**
   * Exchange auth code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    email: string;
  }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      email: userInfo.data.email!,
    };
  }
}

export const emailOutreachService = new EmailOutreachService();
