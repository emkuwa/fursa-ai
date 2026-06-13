# Fursa AI - Production Deployment Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel / Cloudflare                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Next.js     │  │  API Routes │  │  Static     │     │
│  │  Frontend    │  │  (Edge)     │  │  Assets     │     │
│  └──────┬───────┘  └──────┬──────┘  └─────────────┘     │
└─────────┼──────────────────┼──────────────────────────────┘
          │                  │
┌─────────┼──────────────────┼──────────────────────────────┐
│         │         Supabase │                              │
│  ┌──────┴──────────────────┴──────┐                      │
│  │         Supabase Project        │                      │
│  │  ┌─────────┐  ┌──────────────┐ │                      │
│  │  │ PostgreSQL │  │ Auth        │ │                      │
│  │  │ (Database) │  │ (Supabase) │ │                      │
│  │  └─────────┘  └──────────────┘ │                      │
│  │  ┌─────────┐  ┌──────────────┐ │                      │
│  │  │ Storage │  │ Realtime     │ │                      │
│  │  └─────────┘  └──────────────┘ │                      │
│  └────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Background Services                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  n8n        │  │  DeepSeek   │  │  Stripe     │     │
│  │  (Automation)│  │  AI API    │  │  Payments   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation (Week 1-2)

### 1.1 Supabase Setup
```bash
# Create Supabase project
supabase init
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push

# Enable extensions
# - pg_trgm (for fuzzy text search)
# - uuid-ossp (for UUID generation)
```

### 1.2 Environment Variables
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DEEPSEEK_API_KEY=<deepseek-api-key>
OPENROUTER_API_KEY=<openrouter-api-key>
OPENROUTER_API_URL=https://openrouter.ai/v1/chat/completions
OPENROUTER_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
RESEND_API_KEY=<resend-api-key>
RESEND_FROM_EMAIL=no-reply@fursa.ai
WHATSAPP_ACCESS_TOKEN=<whatsapp-access-token>
WHATSAPP_PHONE_NUMBER_ID=<whatsapp-phone-number-id>
WHATSAPP_VERIFY_TOKEN=<whatsapp-verify-token>
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
NEXT_PUBLIC_APP_URL=https://fursa.ai
```

### 1.3 Stripe Setup
1. Create products in Stripe Dashboard:
   - Premium Monthly ($9.99)
   - Enterprise Monthly ($49.99)
2. Configure webhook endpoint: `https://fursa.ai/api/webhooks/stripe`
3. Add webhook events: `checkout.session.completed`, `customer.subscription.*`

## Phase 2: Deployment (Week 2-3)

### 2.1 Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

### 2.2 n8n Deployment Options

**Option A: Self-hosted (Recommended)**
```bash
# Docker deployment
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_HOST=fursa-n8n.vercel.app \
  -e N8N_PROTOCOL=https \
  -e FURSA_API_URL=https://fursa.ai \
  -v n8n-data:/home/node/.n8n \
  n8nio/n8n
```

**Option B: n8n Cloud**
- Sign up at https://app.n8n.cloud
- Import workflow JSONs from `/n8n-workflows/`
- Set environment variables

### 2.3 Domain & DNS
```
A Record: 76.76.21.21 (Vercel)
CNAME: www -> cname.vercel-dns.com
```

## Phase 3: Production Hardening (Week 3-4)

### 3.1 Database Hardening
- Enable point-in-time recovery (PITR) on Supabase
- Set up daily backups
- Configure connection pooling (pgBouncer)

### 3.2 Performance Optimization
- Enable Supabase cache for frequent queries
- Implement Redis caching for AI responses
- Configure CDN caching for static pages
- Enable ISR (Incremental Static Regeneration) for SEO pages

### 3.3 Security
- Enable Row Level Security (already configured in schema)
- Set up rate limiting on API routes
- Implement CSRF protection
- Configure CORS for n8n webhooks
- Regular security audits

### 3.4 Monitoring
- Set up Sentry for error tracking
- Configure Supabase monitoring
- Set up uptime monitoring (Better Uptime / Pulse)
- Configure log aggregation

## Phase 4: Scale (Month 2-3)

### 4.1 Infrastructure Scaling
- Database: Upgrade Supabase plan (Pro → Team → Enterprise)
- Compute: Increase Vercel plan (Pro → Enterprise)
- AI: Set up DeepSeek API rate limiting and caching

### 4.2 Content Delivery
- Set up Bunny.net or Cloudflare CDN
- Optimize images with next/image
- Implement lazy loading for opportunity cards

### 4.3 Tanzania Localization
- Deploy local payment integrations (M-Pesa, Tigo Pesa, Airtel Money)
- Add Swahili translations for all UI
- Set up local hosting mirror for Tanzania users

## Estimated Monthly Costs (Starting)

| Service | Plan | Cost |
|---------|------|------|
| Vercel    | Pro          | $20/mo  |
| Supabase  | Pro          | $25/mo  |
| DeepSeek  | Pay-as-you-go| ~$50/mo |
| Stripe    | 2.9% + $0.30 | per tx  |
| n8n       | Self-hosted  | $0/mo   |
| Domain    | .ai          | ~$70/yr |
| **Total** |              | **~$110/mo** |

## Runbook

### Daily Operations (95% Automated)
- [ ] AI agents collect and process opportunities (auto)
- [ ] n8n delivers digests to users (auto)
- [ ] Quality control audits all content (auto)

### Weekly Operations
- [ ] Review agent error reports (15 min)
- [ ] Check revenue dashboard (10 min)
- [ ] Review user feedback (20 min)

### Monthly Operations
- [ ] Review growth metrics (30 min)
- [ ] Update source list (15 min)
- [ ] Plan feature roadmap (1 hour)

### Incident Response
```
Priority 0 (Critical):
- Site down → Check Vercel status
- Database issues → Check Supabase status
- Payment failures → Check Stripe dashboard

Priority 1 (High):
- AI agent failures → Restart via /admin/agents
- Email delivery issues → Check SMTP logs
- Broken scrapers → Check source URLs

Priority 2 (Medium):
- Low-quality opportunities → Check /admin/opportunities
- User reports → Reivew support queue
- Translation issues → Review AI prompts
```

## Health Check URLs
```
Main site:         https://fursa.ai
API health:        https://fursa.ai/api/system-health
Admin validation:  https://fursa.ai/api/admin/validation
n8n:               https://fursa-n8n.internal
Supabase:          https://app.supabase.com/project/<ref>
Stripe:            https://dashboard.stripe.com
DeepSeek:          https://platform.deepseek.com
Resend:            https://resend.com
WhatsApp:          https://developers.facebook.com/docs/whatsapp
```
