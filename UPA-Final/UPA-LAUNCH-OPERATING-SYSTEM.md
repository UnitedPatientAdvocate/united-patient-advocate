# UPA Launch Operating System

Last updated: 2026-05-24  
Product: United Patient Advocate  
Status: static front-end launch system with local/session state persistence, Gumroad checkout, Vercel routing, and personalized paid output.

## 1. Executive Summary

United Patient Advocate is a fast-launch AI-assisted medical billing review product. It turns a consumer's medical bill intake into a personalized paid workspace with:

- billing review summary
- review areas/findings
- written request templates
- phone scripts
- packet/download system
- patient letters
- action plan and escalation guidance
- optional resume flow when the user opens a generic success link without saved case data

The current system is built for speed to revenue, not full backend durability. It relies on browser storage to preserve intake state through the funnel and uses a resume fallback on `/success` when no saved state exists.

Core business promise:

> Help patients organize, question, and document medical billing concerns before accepting or paying a bill.

Core legal posture:

> Educational billing review and prepared documentation. Not legal, medical, insurance, or financial advice. No guaranteed savings, refunds, corrections, or outcomes.

## 2. Current Funnel Flow

### Primary Same-Browser Flow

1. User lands on `/`
2. Vercel routes `/` to `UPA-Final/01_upa-landing.html`
3. User completes intake:
   - bill type
   - coverage
   - bill amount
   - payment status
   - concerns
   - patient/contact/provider details
   - service date
   - optional file name/upload metadata
   - free-text context
4. Intake is saved into browser storage by `upa-state-persistence.js`
5. User sees analysis screen:
   - `02_upa-analysis-screen.html`
6. User lands on preview/paywall:
   - `03_upa-preview.html`
7. Preview is personalized by:
   - `upa-case-personalization.js`
8. User clicks unlock CTA
9. `goToGumroad()` marks checkout state through `UPAState.markCheckout(...)`
10. User goes to Gumroad checkout
11. Gumroad/email/PDF fulfillment sends user to:
    - `https://unitedpatientadvocate.com/success`
12. `/success` routes to:
    - `UPA-Final/05_upa-success.html`
13. Success page marks paid state and restores case
14. User redirects to:
    - `/dashboard?unlock=1`
15. `/dashboard` routes to:
    - `UPA-Final/04_upa-dashboard.html`
16. Dashboard, packet, letters, scripts, written requests, and downloads use the restored case state.

### Generic Link / No Saved Browser State Flow

This matters because Gumroad emails and PDFs may open a generic `/success` link later, possibly in a different browser/device.

1. User opens `/success`
2. Success page checks for saved intake state using `UPAState.hasIntake(UPAState.getIntake())`
3. If no saved case exists:
   - redirect is paused
   - user sees `Resume Your Review`
   - user must re-enter enough details to rebuild personalization:
     - patient name
     - provider/hospital
     - bill amount
     - service date
     - coverage
     - payment status
     - main concern
     - optional itemized bill upload metadata
4. Submitted resume data is saved through `UPAState.persistIntake(...)`
5. Paid state is marked through `UPAState.markPaid(...)`
6. User is sent to:
   - `/dashboard?unlock=1&resumed=1`
7. Dashboard opens as a reconstructed personalized case, not a generic demo.

## 3. File Architecture

There are two mirrored trees:

- `UPA-Final/`
- `public/UPA-Final/`

The `public/UPA-Final/` copy is the Vercel-served static asset tree. The `UPA-Final/` copy is the source/reference mirror. For launch edits, keep both copies synchronized.

### Main Pages

| File | Purpose |
|---|---|
| `01_upa-landing.html` | Landing page, intake, lead capture, start analysis |
| `02_upa-analysis-screen.html` | Analysis/progress transition page |
| `03_upa-preview.html` | Personalized preview, paywall, Gumroad handoff |
| `04_upa-dashboard.html` | Paid dashboard/workspace |
| `05_upa-success.html` | Payment success, license/state restore, resume fallback |
| `05_upa-packet.html` | Print-ready packet and letter packet source |
| `Transparent.png` | UPA visual/logo asset |

### Shared Scripts

| File | Purpose |
|---|---|
| `upa-state-persistence.js` | Local/session persistence layer for intake, checkout, paid, case, dashboard state |
| `upa-case-personalization.js` | Converts intake state into dashboard, preview, packet, letters, scripts, and guide personalization |
| `upa-download-packet.js` | Generates tailored HTML packet/letters/downloads and print flow |

### Routing

`vercel.json` currently routes:

| Route | Destination |
|---|---|
| `/` | `/UPA-Final/01_upa-landing.html` |
| `/index.html` | `/UPA-Final/01_upa-landing.html` |
| `/success` | `/UPA-Final/05_upa-success.html` |
| `/dashboard` | `/UPA-Final/04_upa-dashboard.html` |
| `/upa-premium-v10.5.html` | `/UPA-Final/04_upa-dashboard.html` |
| `/upa-preview.html` | `/UPA-Final/03_upa-preview.html` |
| `/api/(.*)` | `/api/$1` |

Critical rule:

`/success` must route to `05_upa-success.html`, not directly to dashboard. The success page must mark payment/license state first, restore or resume case state, then open dashboard.

## 4. Vercel, GitHub, Gumroad Setup

### Vercel

Purpose:

- host static UPA funnel
- route clean URLs to static HTML files
- serve public assets

Key deployment dependency:

- Vercel must deploy the repo version containing the latest `vercel.json` and `public/UPA-Final` files.

Launch risk:

- If production appears stale, check whether Vercel is building from the expected GitHub branch and whether latest changes are actually pushed/deployed.

### GitHub

Purpose:

- source control
- Vercel deployment source
- rollback point

Launch discipline:

- Avoid committing preview artifacts, backup files, local AI work folders, and stale exports.
- Keep `.gitignore` and `.vercelignore` aligned.
- Treat `public/UPA-Final` as deployment source.
- Mirror material changes back into `UPA-Final`.

### Gumroad

Purpose:

- checkout/payment
- license/payment confirmation
- fulfillment email/PDF link

Current Gumroad link in preview:

```text
https://upadvocate.gumroad.com/l/busfn?wanted=true
```

Critical Gumroad fulfillment URL:

```text
https://unitedpatientadvocate.com/success
```

Do not send Gumroad users directly to `/dashboard`.

Why:

- `/success` stores license/payment state.
- `/success` restores saved intake state if present.
- `/success` shows Resume Your Review if state is missing.
- `/dashboard` should only open after the paid state and case state have been handled.

## 5. Unlock, Success, Resume, Dashboard Logic

### Preview Unlock

File:

- `03_upa-preview.html`

Function:

- `goToGumroad()`

Current behavior:

- calls `UPAState.markCheckout(...)`
- stores checkout session details
- redirects to Gumroad

Important UX rule:

- Blurred preview unlock CTAs should scroll to the main `Unlock My Full Review` CTA, not immediately send the user to Gumroad. The user should make one clear checkout click.

### Success Page

File:

- `05_upa-success.html`

Responsibilities:

- read Gumroad/license query params when present:
  - `license_key`
  - `key`
  - `token`
- store license key in session/local storage
- call `UPAState.markPaid(...)`
- mark:
  - `upa.paid = 1`
- check whether intake/case state exists
- if state exists:
  - auto redirect to `/dashboard?unlock=1`
- if state does not exist:
  - show Resume Your Review
  - require user to rebuild minimum personalized case
  - save through `UPAState.persistIntake(...)`
  - call `UPAState.markPaid(...)`
  - redirect to `/dashboard?unlock=1&resumed=1`

### Resume Your Review Fields

Required:

- patient name
- provider/hospital
- bill amount
- main concern

Optional but used:

- service date
- coverage
- payment status
- itemized bill upload metadata

Service date rule:

- no future service dates.

Why resume exists:

- Users may open Gumroad fulfillment email/PDF on a different browser.
- Same-browser localStorage cannot be assumed.
- Better to ask for case details again than show generic/default dashboard data.

## 6. State Persistence Rules

File:

- `upa-state-persistence.js`

Storage targets:

- `sessionStorage`
- `localStorage`

Primary keys:

| Key | Purpose |
|---|---|
| `upa.intake.v1` | current normalized intake |
| `upa.checkout.session.v2` | checkout/session snapshot |
| `upa.paid.results.v2` | paid success state |
| `upa.review.session.v1` | review/session snapshot |
| `upa.case.snapshot.v1` | personalized generated case |
| `upa.dashboard.state.v1` | dashboard path/config snapshot |
| `upa.paid` | simple paid flag |
| `upa.license.key` | Gumroad/license key if available |

Key functions:

| Function | Purpose |
|---|---|
| `getIntake()` | returns strongest available intake |
| `hasIntake(value)` | checks whether saved state is meaningful |
| `persistIntake(intake, meta)` | writes intake into storage/session |
| `persistCase(caseData, meta)` | writes generated case snapshot |
| `captureReviewState(meta)` | captures current review/dashboard context |
| `markCheckout(meta)` | stores pre-Gumroad checkout state |
| `markPaid(meta)` | restores session and records paid state |
| `restoreSession(meta)` | rebuilds current session from strongest stored data |

State priority:

1. explicit packet intake override
2. `upa.intake.v1`
3. paid result session intake
4. checkout session intake
5. review session intake
6. case snapshot raw intake

Launch principle:

Every page that depends on personalization should load `upa-state-persistence.js` before personalization/download scripts.

## 7. Intake-To-Output Personalization Mapping

Personalization engine:

- `upa-case-personalization.js`

Core output object:

- `window.UPACase`

The script reads intake, builds a normalized case object, and applies it across:

- preview page
- paid dashboard
- packet
- letters
- guide drawer
- written requests
- call scripts
- download filenames
- print/download packet output

### Intake Fields And Where They Show

| Intake field | Paid output usage |
|---|---|
| Patient name | dashboard badges, packet title, letters, signature lines, filenames |
| First/last name | fallback construction of patient name |
| Email | packet letter header/contact line, intake context |
| Phone | packet letter header/contact line, intake context |
| Provider/hospital | dashboard, packet, letters, scripts, action steps |
| Bill type | dashboard summary, packet context, letters |
| Bill amount | dashboard KPIs, preview, packet, calculator, letters |
| Service date | dashboard meta, packet, letters, scripts |
| Coverage/insurance | dashboard, EOB/rate letter, packet, next steps |
| Payment status | dashboard posture, packet, letters, recovery/next steps |
| Selected concerns | findings, dashboard summary, packet, guide context, letters |
| Other concern | custom concern/addendum logic, dashboard/packet text |
| Free-text description | user note in dashboard, preview, packet, letters, guide context |
| Uploaded bill filename | dashboard note, packet context, download specificity, review strength |
| Account/reference if available | packet/letters/account references |

### Findings Logic

The issue engine maps concern keywords into issue types:

- missing itemized bill
- duplicate charge
- inflated/high charge
- services not received
- out-of-network/surprise bill
- coding or service-level mismatch
- denied/underpaid insurance claim
- collections
- custom concern
- uploaded bill review
- payer responsibility
- amount confirmation
- payment status review
- provider record request

The dashboard currently surfaces up to 3 primary review areas, then adds letter complexity as needed.

### Letter Complexity Logic

Core letter count:

- 3 base letters

Add-on letters can be triggered by:

- network/surprise billing concern
- insurance denial/appeal
- collections status
- paid/refund/payment adjustment status
- coding concern
- unrecognized service concern
- custom concern

This supports the "download all written requests/scripts based on complexity" concept by making the case output scale with intake complexity.

## 8. Packet, Letter, Download, Print System

File:

- `upa-download-packet.js`

### Full Packet Download

Dashboard button:

- `Download Your Full Package`

Handler:

- `upaDownloadPacket(event)`

How it works:

1. Reads current intake using `readIntake()`
2. Restores session via `UPAState.restoreSession(...)`
3. Loads `05_upa-packet.html`
4. Injects intake as `window.__UPA_PACKET_INTAKE__`
5. Inlines `upa-case-personalization.js`
6. Removes the download script from the generated packet
7. Downloads a personalized HTML packet

Filename pattern:

```text
upa-packet-{patient}-{yyyy-mm-dd}.html
```

### Print Flow

Dashboard button:

- `Print`

Handler:

- `upaPrintFullPackage(event)`

How it works:

- builds the same tailored packet as download
- opens a print window
- writes tailored HTML
- calls browser print after load
- fallback opens packet page if popup/print window is blocked

### Share Flow

Dashboard button:

- `Share`

Handler:

- `upaShareAccess(event)`

How it works:

1. builds secure access link:
   - `/success`
2. tries native `navigator.share`
3. falls back to clipboard copy
4. falls back to prompt with copyable URL

Important wording:

- The share link opens saved review on this device or a resume step if case data is missing.

### Individual Letters

Functions:

- `upaDownloadLetter(event, docId)`
- `upaPreviewLetter(event, docId)`

Sources:

- dashboard document cards
- packet pages

Letter output:

- should remove UPA branding where the provider-facing letter should look like patient correspondence
- signature line directly under `Sincerely,` should show the user/patient full intake name
- fallback signature should be `Patient`

### Written Requests Download

Dashboard drawer:

- `Written Requests`

Function:

- `downloadWrittenRequests()`

Output:

- downloads the current written request set shown in the guide drawer
- includes patient/provider/account/date/coverage metadata
- uses `window.UPACase` for case context

## 9. Dashboard Controls And Trust Rules

Current launch-safe controls:

| Control | Status |
|---|---|
| Download Your Full Package | real tailored packet download |
| Print | real tailored packet print flow |
| Share | native share/copy/prompt fallback |
| My Case | real overview tab action |
| Night mode | removed |
| Review My Bill top-right CTA | replaced/removed from paid dashboard |

Trust rule:

No visible dashboard control should be fake, inert, or decorative if it looks clickable.

Audit pattern:

- search for `onclick=`
- confirm every function exists
- confirm every visible button either performs real behavior or is removed
- avoid placeholder toggles
- avoid demo/default data appearing as a user's case

## 10. Copy And Compliance Principles

UPA copy must stay strong but legally safe.

Use:

- may
- can
- helps
- potential
- estimated
- possible
- prepared for you to review and send
- request
- review
- documentation
- compare
- reconcile
- written explanation

Avoid absolute or risky claims:

- cannot be reported
- must hold collection
- legally required, unless citing a specific valid rule
- guaranteed refund
- guaranteed savings
- guaranteed error
- guaranteed bill reduction
- you do not owe
- this charge is illegal

Safer framing examples:

- "This may help document the dispute."
- "Possible savings depend on provider documentation, insurance review, plan terms, and billing office response."
- "The packet helps you request written explanations before accepting the balance."
- "Prepared for you to review, edit if needed, sign, and send."
- "Billing protections and request paths vary by state, plan, provider, and circumstance."

Required disclaimer posture:

- educational information only
- not legal advice
- not medical advice
- not insurance advice
- no guaranteed outcome
- user should review documents before sending

## 11. Launch QA Checklist

### Routing

- `/` opens landing page.
- `/success` opens success page, not dashboard.
- `/dashboard` opens paid dashboard.
- `/upa-preview.html` opens preview.
- `vercel.json` matches current route expectations.
- Production deploy is from the branch containing latest `public/UPA-Final` files.

### State Flow

- Intake saves `upa.intake.v1`.
- Preview restores intake and personalizes.
- Checkout button calls `UPAState.markCheckout(...)`.
- Gumroad fulfillment link goes to `/success`.
- `/success` marks paid state.
- `/success` redirects only when saved case state exists.
- `/success` shows Resume Your Review when no case exists.
- Resume submit saves intake and opens `/dashboard?unlock=1&resumed=1`.
- Dashboard never presents default/demo data as if it is the user's case.

### Personalization

- Patient name appears in dashboard/packet/letters.
- Provider appears in dashboard/packet/letters/scripts.
- Amount appears in dashboard/packet/calculator/letters.
- Coverage appears in dashboard/letters/EOB/rate guidance.
- Payment status changes posture/copy.
- Service date appears in dashboard/letters.
- Concerns appear in findings/letters/guide context.
- Free-text note appears when meaningful.
- Uploaded bill filename/status appears when available.

### Downloads And Actions

- Full package downloads tailored packet.
- Full package file includes injected intake.
- Full package includes inlined personalization script.
- Print opens real print flow.
- Share copies/shares `/success` access link or shows prompt fallback.
- Written requests download uses current drawer content and `window.UPACase`.
- Individual letter downloads use patient/provider/case data.

### Copy/Legal

- No guaranteed savings/refund/error language.
- No "must hold collection" absolute language.
- No "cannot be reported" absolute language.
- No "legally required" unless statute-specific and accurate.
- Recovery language is potential/estimated, not guaranteed.
- Documents say prepared for review/send, not automatic legal filings.

### Build/Deploy

- Static scripts pass syntax checks.
- Source and public copies match for edited launch files.
- `.gitignore` and `.vercelignore` exclude temp/backup/preview artifacts.
- Vercel production deployment uses the latest GitHub source.

## 12. Known Limitations

Current system limitations:

- No real backend account system.
- No server-side case database.
- No cross-device persistence unless user re-enters details through Resume Your Review.
- Uploaded file content is not actually parsed in the static launch version; filename/metadata can be used, not file contents.
- Gumroad license validation is not server-verified in the current static flow.
- Dashboard unlock is mostly front-end trust flow, not hard security.
- Personalization is rule-based and local, not full AI billing analysis.
- Benchmark values are educational placeholders until itemized bill/code data is available.
- Emails/PDFs with generic `/success` links cannot reconstruct exact original intake unless same-browser state exists or user resumes manually.

Launch stance:

These limitations are acceptable for first revenue as long as copy does not imply backend-level permanence, guaranteed analysis, or true uploaded-file parsing.

## 13. Future Backend Roadmap

### Phase 1: Minimal Durable Case Backend

Goal:

- stop relying only on localStorage.

Add:

- case ID
- server-side intake storage
- checkout session mapping
- secure case resume URL
- Gumroad webhook fulfillment
- server-generated signed access token

Suggested stack:

- Vercel functions
- Supabase or Neon/Postgres
- server-side Gumroad webhook endpoint
- signed token in fulfillment URL

Key routes:

```text
POST /api/case
GET /api/case/:token
POST /api/gumroad/webhook
POST /api/case/:id/resume
```

### Phase 2: Real Upload Processing

Add:

- PDF/image upload storage
- OCR
- itemized line extraction
- CPT/HCPCS/revenue code extraction
- EOB comparison fields
- confidence levels
- human-readable audit trail

Suggested tools:

- S3/R2/Supabase Storage
- OCR provider
- Claude/OpenAI extraction step
- structured JSON schema validation

### Phase 3: AI Case Generation

Add:

- AI-generated finding summary
- line-item risk scoring
- custom letters
- provider-specific guidance
- state-specific escalation paths
- plan-type specific language

Guardrails:

- cite source type
- use "may/can/possible"
- require user review
- no legal conclusions

### Phase 4: Account Portal

Add:

- email login
- saved cases
- re-download packet
- update case with new documents
- track sent letters
- 30-day follow-up reminders
- support upsell

## 14. Monetization And Scaling Ideas

### Immediate Revenue Moves

- Keep Gumroad product simple: one purchase unlocks full review packet.
- Add urgency around getting written documentation before payment.
- Use short-form content around:
  - surprise bills
  - ER bills
  - denied claims
  - collections letters
  - medical debt credit reporting
  - itemized bill requests
- Drive users to a free checklist or mini calculator, then paid packet.

### Product Extensions

- $19 basic packet
- $49 full packet plus extra letters
- $99 manual review add-on
- $149 urgent collections/dispute bundle
- subscription for ongoing medical billing support
- affiliate/referral partnerships with patient advocates, debt counselors, legal aid directories

### High-Intent Niches

- ER surprise bills
- out-of-network lab bills
- ambulance bills
- hospital surgery bills
- denied insurance claims
- collections/medical debt notices
- self-pay hospital bills
- maternity/NICU bills
- mental health out-of-network claims

### Traffic Plays

- "Itemized bill request template" SEO pages
- state-by-state medical bill dispute pages
- TikTok/Reels scripts: "Do not pay a hospital bill before asking for this"
- Reddit/Quora answers with educational disclaimers
- downloadable free template lead magnet
- calculator: "How much of my medical bill might be reviewable?"

### Fulfillment Upsells

- "We customize the letters for you"
- "We review your itemized bill"
- "We draft your insurer appeal"
- "We prepare your collections validation packet"
- "We monitor follow-ups for 30 days"

## 15. Reusable Clone-This-Business Framework

UPA is a reusable pattern:

> Intake -> personalized preview -> paid unlock -> success/resume -> tailored dashboard -> downloadable documents -> follow-up workflow.

### Clone Framework

1. Pick a high-pain paperwork niche.
2. Identify a consumer confusion moment.
3. Build an intake that collects case-specific facts.
4. Show a partial preview of the likely review areas.
5. Sell a low-ticket document/action packet.
6. Use `/success` to restore or resume case state.
7. Generate tailored dashboard/packet/scripts.
8. Add print/download/share actions.
9. Keep claims legally safe.
10. Add backend later only after sales validate demand.

### Ideal Clone Niches

- insurance denial appeal packet
- landlord deposit dispute packet
- credit report dispute packet
- bank fee refund packet
- debt validation packet
- warranty claim dispute packet
- airline refund/compensation packet
- parking/toll ticket dispute packet
- college financial aid appeal packet
- utility bill dispute packet

### Required Clone Components

| Component | UPA example | Clone requirement |
|---|---|---|
| Intake | medical bill facts | collect case facts |
| Preview | review areas | show partial insight |
| Checkout | Gumroad | low-friction payment |
| Success | resume/restore | avoid blank/default state |
| Dashboard | paid workspace | case-specific action center |
| Documents | letters/requests | downloadable deliverables |
| Scripts | call/written wording | make user action easier |
| State | local/session now | backend later |
| Copy | safe potential language | no guarantee claims |

### Clone Launch Rule

Do not overbuild the first version.

Launch with:

- static funnel
- saved local state
- resume fallback
- Gumroad checkout
- downloadable packet
- clear disclaimers
- real buttons only

Add backend after:

- first sales
- repeated support issues
- users asking to return/update cases
- enough demand to justify durable accounts

## 16. Operator Notes

Launch priorities:

1. Production must deploy latest `public/UPA-Final` and `vercel.json`.
2. Gumroad fulfillment must link to `/success`.
3. `/success` must never bypass state handling.
4. Dashboard must never feel like a demo after payment.
5. Every visible control must do something real.
6. Every intake answer should visibly shape the output.
7. Copy must sell the value without promising an outcome.

Revenue-first operating principle:

Ship the safe, useful, paid document system now. Let first customers reveal whether the next investment should be backend accounts, real OCR, manual review upsells, or a new clone niche.

