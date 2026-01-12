-- =====================================
-- SENT EMAILS TRACKING TABLE
-- =====================================
-- Tracks all emails sent through the Job Tracker for follow-up management

CREATE TABLE IF NOT EXISTS "public"."jt_sent_emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobApplicationId" TEXT,
    
    -- Recipient info
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientPosition" TEXT,
    "company" TEXT NOT NULL,
    
    -- Email content
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    
    -- Status tracking (manual - no tracking pixels for safety)
    "status" TEXT NOT NULL DEFAULT 'sent',
    
    -- Gmail reference
    "gmailMessageId" TEXT,
    "gmailThreadId" TEXT,
    
    -- Follow-up tracking
    "followUpDate" TIMESTAMP(3),
    "followedUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "lastFollowUpAt" TIMESTAMP(3),
    
    -- Notes
    "notes" TEXT,
    
    -- Timestamps
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jt_sent_emails_pkey" PRIMARY KEY ("id")
);

-- Foreign key to job applications (optional link)
ALTER TABLE "public"."jt_sent_emails" 
ADD CONSTRAINT "jt_sent_emails_jobApplicationId_fkey" 
FOREIGN KEY ("jobApplicationId") 
REFERENCES "public"."jt_applications"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "jt_sent_emails_userId_idx" ON "public"."jt_sent_emails"("userId");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_jobApplicationId_idx" ON "public"."jt_sent_emails"("jobApplicationId");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_recipientEmail_idx" ON "public"."jt_sent_emails"("recipientEmail");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_company_idx" ON "public"."jt_sent_emails"("company");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_status_idx" ON "public"."jt_sent_emails"("status");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_followUpDate_idx" ON "public"."jt_sent_emails"("followUpDate");
CREATE INDEX IF NOT EXISTS "jt_sent_emails_sentAt_idx" ON "public"."jt_sent_emails"("sentAt");
