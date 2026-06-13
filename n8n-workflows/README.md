# n8n Workflows for Fursa AI

Import these workflows into n8n (http://localhost:5678) to automate the platform.

## Workflow Files

Each JSON file in this directory is a complete n8n workflow definition.

## Setup

1. Start n8n: `npx n8n start`
2. Go to http://localhost:5678
3. Create the following credentials:
   - Supabase API (Service Role Key)
   - DeepSeek API (HTTP Headers)
   - Stripe API
   - SMTP (for email)
   - WhatsApp Business API (Twilio)
4. Import workflows via n8n UI → Workflows → Import

## Workflow Descriptions

### 1. Opportunity Collection Pipeline
Runs every 4 hours. Calls the Fursa AI API to trigger collection, analysis, and categorization agents.

### 2. Daily Digest Notifications
Runs daily at 8 AM and 6 PM. Sends personalized opportunity digests to users via email and WhatsApp.

### 3. Content Marketing Automation
Runs daily at 9 AM. Generates social media posts and blog content using DeepSeek AI.

### 4. SEO Page Generator
Runs daily at 5 AM. Generates SEO-optimized landing pages for categories and countries.

### 5. Quality Control Audit
Runs every 8 hours. Audits opportunities for broken links, accuracy, and duplicates.

### 6. Trend Analysis Report
Runs weekly on Monday. Analyzes platform trends and generates reports.

### 7. AI CEO Dashboard Report
Runs daily at 6 AM. Generates the daily operational report for the admin dashboard.

### 8. Revenue Sync
Runs every 12 hours. Syncs Stripe subscription data and tracks revenue.

## Manual Triggers

Each workflow has a Webhook trigger. You can manually trigger via:
POST /webhook/fursa-ai/{workflow-name}

Or via the Fursa AI admin panel at /admin/agents
