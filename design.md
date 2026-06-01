# TeenVerse Hub UI Design Brief for Google Stitch

Create a beautiful, production-ready, responsive front-end design for **TeenVerse Hub**, a safe freelancing, learning, payment, and profile platform for teenagers and young creators in India. The product connects teen freelancers with clients while wrapping the whole experience in identity verification, guardian-aware controls, secure payments, AI assistance, skill certification, and trust-first portfolio/resume systems.

The design should feel premium, modern, teen-friendly, and trustworthy. It should look exciting enough for Gen Z creators, but serious enough for clients, guardians, and admins to trust real payments and verified identity workflows.

## Core Product Promise

TeenVerse Hub is a protected opportunity platform where teenagers can:

- Build verified creator profiles.
- Learn freelancing basics and digital safety.
- Pass Academy quizzes and AI-generated skill assessments.
- Apply for jobs using energy points.
- Get hired by clients through secure escrow.
- Deliver work, request revisions, chat safely, and receive payouts.
- Generate proof-aware resumes and portfolio profiles.
- Use wallet rewards, subscriptions, and a Hubble Store integration.

Clients can:

- Post jobs for free.
- Search and hire verified teenage talent.
- Use AI talent matching.
- Fund projects through protected escrow.
- Review work, request revisions, approve delivery, release payments, and leave reviews.

Parents/guardians and admins are part of the trust layer:

- Minors require guardian consent for identity and finance flows.
- Parent mode can lock sensitive client actions.
- Parent approval is routed to a dedicated parent portal.
- Admins can review KYC, reports, escrow orders, support tickets, logs, users, jobs, and payouts.

## Brand Personality

Design for a product that is:

- Safe, verified, and transparent.
- Youthful without feeling childish.
- Premium and fintech-grade around money.
- Energetic around learning, badges, and growth.
- Calm and structured around KYC, guardian consent, reports, and disputes.
- AI-native, but honest about what is verified versus AI-generated.

Suggested visual language:

- Light/dark mode support.
- Clean dashboard shell with dense but readable product UI.
- Use glassy panels sparingly for dashboard surfaces.
- Use strong trust colors: indigo, teal, emerald, amber, slate, white, black.
- Use premium accents for plans: cyan for Starter, fuchsia/purple for Pro, black/gold for Elite.
- Avoid making everything one purple gradient. Use a balanced palette.
- Cards should have polished 8-16px radii depending on density; modals can be slightly softer.
- Icons should be crisp, line-based, and functional: shield, fingerprint, wallet, briefcase, sparkles, crown, lock, message, academy/book, receipt, alert/report.

## Primary Roles

Design all key screens around these roles:

1. **Teen Freelancer / Creator**
   - Ages 14-21 only.
   - Can apply for jobs after KYC.
   - Uses energy points to apply.
   - Builds profile, portfolio, resume, and badges.
   - Needs guardian flow if under 18.
   - Needs bank linkage before payouts.

2. **Client / Hirer**
   - Posts jobs.
   - Searches talent manually or with AI.
   - Funds escrow before a project starts.
   - Reviews delivery and releases payment.
   - Can report issues and use support guide.

3. **Parent / Guardian**
   - Parent approval route exists.
   - Guardian consent is required for minors.
   - Parent mode locks sensitive actions like approve/pay/release escrow.
   - Parent portal is external at parent.teenversehub.in.

4. **Admin**
   - Manages users, KYC, reports, jobs, services, support tickets, audit logs, and escrow/financial flows.
   - Can force release/refund escrow, ban users, resolve reports, and reply to support tickets.

## Information Architecture

Create a dashboard-first application. The app should not feel like a marketing site. The authenticated dashboard is the main product.

### Main Dashboard Navigation

Sidebar sections:

- Dashboard / Overview
- Workspace
  - HireGenie for clients
  - Find Jobs for freelancers
  - My Listings for clients
  - Pricing & Fees for clients
  - My Gigs for freelancers
  - Orders & Jobs
  - Portfolio
  - Store
  - Messages
- Growth for freelancers
  - My Profile
  - Level Up / Pricing
  - Academy
  - Resume Builder
  - Share Profile
- System
  - My Records
  - Help & Support
  - Settings

Header elements:

- Current tab title.
- User greeting.
- Energy pill for freelancers.
- Light/dark segmented theme toggle.
- Notification bell with push notification status and clear-all action.
- Mobile menu.

Sidebar should show:

- TeenVerseHub wordmark.
- User avatar/initial.
- Role label.
- Level badge.
- Energy meter.
- Top badges.
- XP progress.
- Zen/collapsed mode.

## Onboarding and Auth Flow

Design a multi-step authentication experience:

- Login with email/password.
- Google and GitHub social login.
- Forgot password with OTP verification.
- Cloudflare Turnstile security check when configured.
- Signup step 1: choose role, "Creator / Freelancer" or "Client / Hirer".
- Signup step 2: credentials.
- Signup step 3: profile details and Indian phone verification through MSG91 OTP.
- Signup step 4: terms agreement and source attribution.
- Age gate for freelancers: platform is exclusive to ages 14-21.
- Custom date picker for DOB.
- For freelancers, collect DOB, gender, nationality, phone, referral code, and source.
- For clients, collect organization/client identity.

The onboarding should feel clean, calm, mobile-first, and trustworthy. Use step bars, role cards, OTP status badges, secure check panels, and clear error states.

## KYC, DigiLocker, PAN, and Guardian Flow

This is a core trust feature. Make it a polished multi-step modal or full-screen flow.

### Identity Verification Flow

Step 1: **Age Verification via DigiLocker**

- Use a fingerprint/shield visual.
- Explain that the platform redirects to official DigiLocker.
- Explain that only Date of Birth is extracted to verify age.
- Show secure session preparing state.
- Show "Verify Age via DigiLocker" CTA.
- Show success animation state: age verified, XP awarded, identity badge unlocked.
- Store visual state as "DigiLocker verified".

Step 2: **Financial Identity via PAN**

- Adult users enter their own PAN.
- Minors enter parent/guardian PAN.
- PAN should be displayed in uppercase format.
- Mention NSDL/Surepass verification as the identity check layer.
- Show status for "PAN verified" after success.

Step 3: **Guardian Consent for Minors**

- If user is under 18, show a required guardian declaration.
- Wording: "I confirm I am the legal guardian. I approve this minor to participate on TeenVerseHub and assume financial responsibility."
- Store consent metadata visually:
  - Guardian name.
  - Consent version.
  - IP captured.
  - User agent captured.
  - Consent timestamp.

Step 4: **Bank Linkage**

- Separate bank linking flow.
- Adult bank flow uses user's own bank details.
- Minor bank flow requires guardian bank account details.
- Required inputs:
  - IFSC code.
  - Bank name.
  - Account number.
  - Account holder name.
  - Guardian name for minors.
  - Guardian relationship: Parent or Legal Guardian.
  - Checkbox confirming this is the parent/guardian bank account.

KYC should unlock:

- Ability to apply for paid jobs.
- Ability to receive funds.
- Referral wallet reward release.
- Verified identity badge.

## Protected Payments and Escrow

Make payments feel fintech-grade and trust-first.

Core concepts:

- Clients fund escrow when hiring.
- Money is held safely until work is submitted and approved.
- Funds are never forfeited; they are released or refunded.
- Work approval and payment release are separate actions.
- If work is submitted and client does not review within 7 days, the escrow agreement says funds may auto-release.
- Payment gateway uses Cashfree.
- Escrow/order management goes through secure backend Edge Functions.
- Payment statuses include Pending, Accepted, Submitted, Completed, Processing, Paid, Rejected, Disputed, Revision Requested.

Payment modal should include:

- "Secure Escrow Payment" title.
- Total payable amount.
- Platform fee.
- Taxes as applicable by law.
- Freelancer receives amount.
- Mandatory escrow terms checkbox.
- 256-bit SSL secured note.
- Confirm transfer CTA disabled until escrow terms accepted.

Client order actions:

- Pending: reject or hire and pay.
- Accepted: escrow active, chat, cancel order.
- Submitted: review delivery, view link/files, chat, request revision, reject/refund, approve.
- Completed: release payment, unless Parent Mode locks it.
- Paid: rate freelancer.

Freelancer order actions:

- Pending: waiting for client.
- Accepted: chat or deliver work.
- Revision Requested: chat and resubmit.
- Submitted: under review.
- Processing: bank linked/payment queue or link bank to receive.
- Paid: funds deposited.

## Wallet, Rewards, Subscriptions, and Store

Design a wallet-aware ecosystem.

Wallet:

- Wallet balance appears on overview.
- Referral rewards:
  - Friend gets INR 5 after KYC.
  - Referrer earns INR 10.
  - Referral code can be copied.
- Wallet can be applied to subscriptions.
- Wallet powers Hubble Store redemption.

Daily rewards:

- Daily reward modal.
- Energy and wallet reward feedback.

Subscriptions:

Freelancer plans:

- Basic: free, 5 bids/month, 1 resume/month, standard support, 10% commission.
- Starter: INR 149, 12 bids/month, 2 resumes/month, founder chat support, early access, Starter badge, 7% commission.
- Pro: INR 199 annual display / INR 999 monthly display in current code, 18 bids/month, 6 resumes/month, direct team support, Pro badge, higher visibility, founder community access, 6% commission.
- Elite: INR 399 annual display / INR 3999 monthly display in current code, unlimited bids, unlimited resumes, priority VIP support, Elite badge, top visibility, Elite jobs, 4% commission.

Client pricing:

- Job posting is free.
- Unlimited job posts and edits.
- Review unlimited portfolios.
- Free chat and interviewing.
- 5% platform fee per successful transaction.
- Escrow trust explainer: fund escrow, review work, release funds.

Subscription checkout:

- Show wallet balance toggle.
- Wallet deduction line.
- Amount to pay.
- Pay entirely with wallet CTA if final payable is zero.
- Gateway CTA if payment remains.
- Active premium plan locks switching until expiry.

Hubble Store:

- Store tab with embedded Hubble Store iframe.
- Wallet balance displayed.
- Status pills: Starting, Authenticating, Connecting, Handshaking, Live, Ready, Error, Closed.
- Actions: sync wallet, reload store, open full screen.
- Metrics: balance, coin rate "1 coin = INR 1", SSO JWT ready, last synced.
- Error states for missing config, authentication failure, invalid phone number, store closed.

## AI Implemented Everywhere

Make AI a visible but responsible design layer.

AI features found in the platform:

- **AI Talent Matcher / HireGenie** for clients:
  - Client describes exact project, skills, budget, and urgency.
  - AI parses the query.
  - AI returns recommended freelancers:
    - Best overall match.
    - Fastest responder.
    - Most cost effective.
  - Each recommendation shows match score, rating, hourly rate, response time, and reasons.

- **AI Auto-Draft for Job Applications**:
  - Freelancer can auto-draft a cover letter.
  - Use a typewriter/synthesizing animation.
  - Generated proposal references job title, client, user specialty, budget, duration, and portfolio.

- **AI Academy Assessments**:
  - Static foundation quizzes exist for freelancing, digital safety, pro communication, and money smarts.
  - Advanced skill gates can generate AI quizzes for a job category or specific job topic.
  - Passing unlocks skill certification, XP, energy, and badges.

- **AI Resume Builder**:
  - Paste raw notes, links, old resume, achievements.
  - Build a journey statement.
  - Add proof points.
  - Add skills.
  - Run "AI Polish" to convert rough data into impact-first resume language.
  - AI-generated content must be marked unverified until proof exists.

- **AI Portfolio Magic**:
  - Raw portfolio text can become a professional case study.

- **AI Usage Trust Layer**:
  - Resume system separates verified content from AI-generated/self-declared claims.
  - Trust score and risk flags warn when language is AI-generated or proof is missing.

The UI should make AI feel helpful, fast, and magical, but never deceptive. Any AI-generated claim should carry an "AI generated" or "Unverified" chip until proof exists.

## Academy and Gamification

Design a strong growth loop:

- XP progress.
- User levels.
- Energy points.
- Badges.
- Skill certifications.
- Daily reward modal.
- Academy modules.

Academy modules:

- Freelancing 101: basics of freelancing, taxes, deadlines, multiple clients, invoices.
- Digital Safety: phishing, platform-only communication, avoiding scams, no passwords, no random files.
- Pro Communication: reply etiquette, revisions, feedback, no all-caps, reply speed.
- Money Smarts: budget, savings, platform fees, escrow.
- Skill-specific certifications:
  - Development.
  - Creative Design.
  - Video and Animation.
  - Music and Audio.
  - Writing and Copywriting.

Rewards:

- General module complete: XP and +2 energy.
- Skill certification: +500 XP, +5 energy, Skill Certified badge.
- KYC success: identity badge and XP.
- Complete profile: +10 energy.
- First paid gig: First Gig badge.

## Jobs, Hiring, Applications, and Orders

Freelancer mission board:

- Search missions by title, description, and tags.
- Toggle Normal and Elite missions.
- Elite missions are locked unless user has Elite plan.
- Job card details:
  - Title.
  - Client name.
  - Duration.
  - Job type.
  - Posted time.
  - Description with expand/collapse.
  - Attachments.
  - Tags.
  - Budget.
  - Report job.
  - Apply CTA.
  - Elite visual styling for elite jobs.

Apply modal:

- Energy cost, currently 2 energy points.
- Current energy balance after application.
- Bid amount input.
- Dynamic platform fee by plan.
- Payout amount preview.
- AI Auto-Draft cover letter.
- Educational protocol checkbox.
- Send proposal CTA disabled until requirements are met.

Client hiring:

- AI Talent Matcher command bar.
- Verified Talent Directory.
- Freelancer cards:
  - Avatar.
  - Verified badge.
  - Name.
  - Tagline/specialty.
  - Rate.
  - Rating.
  - Skills.
  - Elite badge if active.
  - Profile and Chat actions.
- Direct hire can happen from chat after a project request.

Order timeline:

- Show project timeline by status.
- Show order ID.
- Use state chips and icons.

Delivery:

- Freelancer submits permanent work link and optional message.
- UI should suggest permanent links such as Google Drive or GitHub.
- File upload surface can be included, but delivery requires a link.
- Client review screen displays note, external link, attachments, approve/revision/reject actions.

## Messaging and Safety

Messaging is a protected platform channel.

Design chat with:

- Inbox view.
- Active conversation view.
- Real-time connection indicator.
- Secure connection reconnecting banner.
- Direct message versus project chat labeling.
- Project ID for secure project chat.
- Chat locks after completed/paid/rejected/cancelled states.
- Quick replies for clients and freelancers.
- Report button.
- Direct hire modal from chat.
- System messages for request-to-hire and escrow-funded project start.

Safety rules:

- Block external contact info.
- Detect phone numbers, emails, URLs, and social platform handles.
- Warn: "Do not share external contact information. Escrow protects both parties."
- Reports go to Trust and Safety.
- Report review promised within 24 hours in the chat report modal.

## Resume Builder and Proof-Aware Trust

This is a standout feature and should get a rich interface.

Resume Studio steps:

1. Raw Material: paste notes, links, old resume, wins.
2. Your Story: write a two-line journey statement.
3. Proof Point: add one role, project, or achievement.
4. Capabilities: add a skill and proof source.
5. AI Polish: transform content into professional, impact-focused language.

Trust system:

- Trust score displayed prominently.
- Trust bands: Low Trust, Medium Trust, High Trust.
- Risk levels shown as chips.
- Trust breakdown cells.
- Risk flags:
  - AI-generated language is unverified.
  - Most experience is self-declared.
  - Skills are not proof-backed.
- Verified-only toggle versus full resume.
- Export PDF.

Proof validation:

- Allowed proof domains:
  - GitHub.
  - Behance.
  - Dribbble.
  - Figma.
  - LinkedIn.
  - Vercel.
  - Netlify.
  - YouTube.
- GitHub proof can check owner match against profile.
- Platform-verified work is based on TeenVerse application/payment records.
- Client-safe resume view excludes self-declared and AI-only claims and hides high-risk profiles.

Resume preview:

- A4-style resume canvas.
- "TeenVerseHub Resume" label.
- Verified Trust score.
- Platform Verified Work section.
- Verified Skills section.
- Self Declared Experience and Skills visible only when "Full resume" is selected.
- AI-generated content marked clearly.

## Public Profile, Portfolio, and Share Card

Freelancer profile should include:

- Name.
- Tagline.
- Specialty.
- Bio.
- Social links:
  - GitHub.
  - LinkedIn.
  - Instagram.
  - Website.
- Cover image.
- Verified skills.
- Self-declared skills.
- Badges.
- Trust score.
- Risk level.
- Services/gigs.
- Portfolio items.
- Platform-backed work records.
- External portfolio links.

Client public profile modal:

- Opens a freelancer profile without exposing private data.
- Shows badges, portfolio, projects, services, and verified work.
- Sticky footer action: "Hire This Freelancer".

Share profile:

- Generate downloadable TeenVerse profile card.
- Share to Instagram story if Web Share API supports it.
- Copy referral/story join URL.
- Use referral code or creator ID in the shared URL.

## Records and Invoices

Design a records area where users can access:

- Application/order history.
- Status.
- Payment records.
- Generated invoice PDFs.
- Signed invoice links.
- TeenVerseHub invoice visual:
  - Invoice ID.
  - Date.
  - Job title.
  - Payer/billed to.
  - Freelancer/payee.
  - Gross amount.
  - Platform fee based on plan.
  - Net earnings.
  - Payment receipt for clients.

## Support and Community

Client support view:

- Client Hub and Guides.
- Step-by-step guide:
  - Post your gig.
  - Review proposals.
  - Secure escrow payment.
  - Approve and release.

Freelancer support view:

- Basic users see locked help desk.
- Premium users can create in-app support tickets.
- Founder Help Desk chat-style UI.
- Active ticket status.
- Admin replies in real time.
- Ticket resolved email notification.

Community:

- Pro and Elite can generate secure one-time Discord invite.
- Elite can access WhatsApp support.
- Email support link: support@teenversehub.in.

## Notifications

Notification surfaces:

- In-app notifications list.
- Clear all.
- Browser push permission prompt.
- Push tokens stored per device.
- Foreground messages.
- Notification triggers:
  - New job available.
  - New application.
  - Application updated.
  - Work submitted.
  - Work approved.
  - Payment released.
  - Revision requested.
  - Reviews.

Design notification badges and empty states clearly.

## Admin Dashboard

Create a distinct admin interface with dense operational UI.

Admin tabs:

- Overview.
- Users.
- Jobs.
- Services.
- Reports.
- Financials.
- Logs.
- Support.

Admin overview metrics:

- Total users.
- Total jobs.
- Total services.
- Total revenue.
- Active reports.
- Held in escrow.
- Pending KYC.
- Active tickets.

Admin capabilities:

- Paginated clients/freelancers list.
- Approve/reject KYC.
- View pending KYC counts.
- Ban users.
- Delete jobs and services.
- Resolve reports.
- View evidence.
- View and manage escrow orders.
- Force release escrow.
- Force refund escrow.
- View masked banking details.
- See audit logs from admin, user, and finance actions.
- Reply to support tickets.
- Resolve support tickets and trigger email.

Admin UI should be utilitarian, not flashy. Use tables, filters, status chips, action buttons, audit timelines, and confirmation modals.

## Safety, Compliance, and Legal Tone

Include subtle legal/trust footer copy in the app:

- TeenVerseHub acts as an intermediary platform under IT Act, 2000.
- Disputes are resolved via administrative mediation.
- Funds are held in neutral escrow and are never forfeited, only refunded or released.
- Users under 18 require parent/guardian consent.
- Payments for minors may need to be processed through a parent's account.
- Parents maintain the right to audit their child's activity.
- Platform charges 5% facilitation fee on completed client transactions.
- Collect minimal data for verification.
- Do not sell data to third parties.

Trust and safety surfaces:

- Report job.
- Report user.
- Report chat violation.
- False reporting warning.
- Admin review.
- Parent mode locks.
- KYC locks.
- Bank linkage locks.
- Secure project chat.

## Screen Requirements

Please generate UI for these screens:

1. Login screen.
2. Multi-step signup screen.
3. Terms agreement screen.
4. Main dashboard overview for freelancer.
5. Main dashboard overview for client.
6. KYC identity modal with DigiLocker, PAN, and guardian consent.
7. Bank linkage modal for adult and minor.
8. Freelancer mission board with normal/elite toggle.
9. Apply job modal with energy, bid, fee, payout, and AI cover letter.
10. Client HireGenie AI Talent Matcher.
11. Verified talent directory.
12. Applications / Orders table.
13. Work delivery review modal.
14. Secure escrow payment modal.
15. Messaging inbox and active secure chat.
16. Academy screen with orientation modules and certification badges.
17. Resume Builder / Resume Studio.
18. Public profile view.
19. Share profile card.
20. Pricing and subscription checkout.
21. Hubble Store / wallet redemption screen.
22. Records and invoices screen.
23. Help and Support screen for client.
24. Premium support ticket screen for freelancer.
25. Settings screen with parent mode, profile update, and KYC CTA.
26. Admin overview dashboard.
27. Admin reports and financials dashboard.
28. Admin support ticket chat.

## Component and State Details

Use these components repeatedly:

- Sidebar item with active state.
- User identity card.
- Level badge.
- Badge chips.
- Energy meter.
- XP progress bar.
- Wallet card.
- KYC status card.
- Referral card.
- Job card.
- Talent card.
- AI result card.
- Order status chip.
- Timeline component.
- Secure modal.
- Toast notification.
- Empty state.
- Report modal.
- Confirmation modal.
- Pricing card.
- Trust score card.
- Risk flag chip.
- Proof URL input.
- Resume preview canvas.
- Notification dropdown.
- Push permission prompt.

Important states:

- Loading.
- Empty.
- Locked.
- Verified.
- Pending.
- Error.
- Reconnecting.
- Processing.
- Success.
- Parent Mode Active.
- KYC Required.
- Bank Link Required.
- Active Plan Locked.
- Elite Required.

## Tone and Microcopy

Use short, clear product copy:

- "Identity Secured"
- "Complete KYC"
- "Verify Age via DigiLocker"
- "Financial Identity"
- "Guardian Consent Required"
- "Funds held safely in escrow"
- "Release only when satisfied"
- "AI Auto-Draft"
- "Verified only"
- "Full resume"
- "Platform Verified Work"
- "Self-declared"
- "AI-generated language is unverified"
- "Secure Project Chat"
- "External contact sharing is blocked"
- "Parent Mode Active"
- "Link Bank to Receive"
- "Wallet Applied"
- "Founder Help Desk"

Avoid childish language on finance and safety screens. Keep teen-friendly energy in Academy, badges, profile sharing, and rewards.

## Responsive Behavior

- Mobile: sidebar becomes drawer, cards stack, command bars stack vertically, tables become scrollable or card lists.
- Desktop: fixed/collapsible sidebar, sticky top header, dense grid layouts.
- Modals must fit mobile screens with scrollable content.
- Avoid overflowing text inside buttons and cards.
- Use accessible contrast in both light and dark mode.

## Final Design Goal

The final UI should make TeenVerse Hub feel like:

- A verified opportunity hub for teen creators.
- A safe hiring marketplace for clients.
- A protected earning system for minors.
- An AI-powered career growth dashboard.
- A transparent fintech-grade escrow and wallet platform.
- A trust-first profile and resume network where proof matters more than hype.
