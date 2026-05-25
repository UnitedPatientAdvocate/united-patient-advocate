# Master Prompts And AI Workflows

Last updated: 2026-05-24  
Product reference: United Patient Advocate  
Purpose: preserve the AI prompting, orchestration, launch workflows, and founder operating patterns used to build UPA quickly without losing trust.

This file is a reusable AI founder playbook. It is written so the same workflow can be reused to launch new AI-assisted digital products, document generators, funnels, lightweight SaaS tools, and high-conversion niche utilities.

## 1. Core Operating Philosophy

The winning operating model was:

> Revenue first. Perfection later. But never break trust.

This means:

- ship the smallest paid product that feels real
- avoid fake controls and fake personalization
- make every user input visibly matter
- use strong conversion copy without guaranteeing outcomes
- patch launch blockers before polishing nice-to-haves
- use AI for speed, but verify critical flows manually

The key product shape:

> Intake -> personalized preview -> paid unlock -> success/restore/resume -> tailored dashboard -> downloadable packet -> follow-up workflow.

The key execution shape:

> Strategy AI decides what matters. Creative AI drafts. Coding AI implements and verifies. Founder makes revenue-priority calls.

## 2. AI Role Division

### GPT / Strategy Role

Best for:

- business model decisions
- funnel strategy
- monetization
- launch sequencing
- risk prioritization
- customer psychology
- "what matters before launch?"
- converting vague product goals into execution checklists

Use GPT when the question is:

- What should we sell?
- What should we cut?
- What will make users pay?
- What will cause refunds?
- What should be fixed before launch?
- What is the fastest path to first revenue?

### Claude / Creative Product Role

Best for:

- landing page concepts
- premium UX copy
- emotional flow
- trust language
- longform document/letter content
- polished dashboard sections
- consumer-friendly explanations
- rewriting harsh or risky claims

Use Claude when the question is:

- How should this feel?
- How do we make this sound premium and human?
- How do we explain scary billing issues without overclaiming?
- How do we make the product feel complete?
- How do we turn inputs into emotionally satisfying output?

### Codex / Engineering Operator Role

Best for:

- reading the repo
- making targeted code changes
- routing fixes
- state persistence
- file mirroring
- deployment-readiness checks
- syntax checks
- dead-control audits
- source/public parity
- implementation verification

Use Codex when the task is:

- fix this route
- wire this button
- persist this data
- mirror source/public files
- audit all occurrences
- create a backup
- update `.gitignore` / `.vercelignore`
- run verification
- document exact files changed

## 3. When To Use Claude Vs Codex Vs GPT

| Situation | Best AI |
|---|---|
| "What should this product be?" | GPT |
| "What should the funnel promise?" | GPT |
| "Rewrite this section to convert better" | Claude |
| "Make this copy legally safer" | Claude + GPT review |
| "Find stale deployment issue" | Codex |
| "Patch state persistence" | Codex |
| "Audit fake controls" | Codex |
| "Create launch checklist" | GPT or Codex |
| "Build polished landing page language" | Claude |
| "Implement exact file changes" | Codex |
| "Decide whether to add backend now" | GPT |
| "Preserve operating docs" | Codex |

Rule:

Do not ask a creative model to blindly edit production files unless an engineering model verifies the implementation. Do not ask a coding model to invent product strategy without giving it the revenue goal.

## 4. Best Codex Prompt Patterns

### Must-Fix Only Prompt

Use this when launch is close and scope creep is dangerous.

```text
Apply must-fix launch blockers only:

1. [specific issue]
2. [specific issue]
3. [specific issue]

Do not redesign.
Do not add features.
Do not touch unrelated files.
Mirror source + public copies.
Return exact files changed and verification steps.
```

Why it worked:

- constrained scope
- forced verification
- prevented polishing detours
- made Codex preserve existing design

### Fake/Inert Control Audit Prompt

```text
Fix or remove any fake/inert dashboard controls:

1. [control] must either actually work or be hidden/removed.
2. [button] must perform [real behavior].
3. [button] must use current restored/resumed case data.

Do not leave fake controls visible.
Do not redesign.
Return exact files changed and verification steps.
```

Why it worked:

- converted "polish" into trust-critical QA
- forced button behavior to be real
- caught dead Night/Print/Share issues

### State Persistence Prompt

```text
Critical launch issue:

The current payment flow loses the user's intake personalization state after checkout.

Fix required:
Persist ALL intake/review state before leaving for checkout and automatically restore it after returning through /success and dashboard unlock flow.

Preserve:
- provider/hospital name
- findings/issues
- billing amounts
- uploaded/intake responses
- generated personalization
- timeline/review state
- dashboard configuration

Do not reset users into demo/default state after payment.
Do not redesign UI.
Only fix state persistence and restore the SAME user session/case after payment return flow.
```

Why it worked:

- named the broken user experience
- listed exact state categories
- prohibited redesign
- made "same case" the acceptance criterion

### Resume Fallback Prompt

```text
If /success loads without intake state, pause the redirect and collect enough information to rebuild the user's personalized case before opening dashboard:

- patient name
- provider/hospital
- bill amount
- insurance/payment status
- service date
- main concerns
- itemized bill upload if available

Once submitted, save into the same dashboard/packet/letter/script state system and open /dashboard?unlock=1&resumed=1.

Do not show demo data as if it is their case.
Do not redesign.
```

Why it worked:

- solved cross-device Gumroad/email/PDF weakness
- made missing state explicit
- avoided fake default dashboard

### Intake-To-Output Mapping Prompt

```text
Audit the intake-to-output mapping.

Every intake answer and free-text concern should visibly affect the paid dashboard, packet, letters, scripts, or next steps.

If a field is not used, either wire it into personalization or remove/soften it so it does not feel fake.

Do not redesign.
Focus only on making user input matter in the final paid output.
```

Why it worked:

- focused on trust, not UI polish
- forced every field to justify itself
- improved perceived personalization without adding backend

### Documentation Capture Prompt

```text
Create a final launch knowledgebase file inside the repo.

Capture the entire current product/business system so I can reuse this as a repeatable blueprint later.

Include:
- funnel flow
- file architecture
- payment setup
- state logic
- QA checklist
- limitations
- future roadmap
- clone-this-business framework

Documentation only. Do not change app behavior or code.
```

Why it worked:

- preserved launch intelligence
- converted messy context into reusable operating system
- avoided future "why did we do this?" loss

## 5. Best Claude Prompt Patterns

### Premium But Safe Copy Prompt

```text
Rewrite this section to keep the premium/conversion-focused tone, but soften absolute claims.

Avoid:
- guaranteed savings
- guaranteed refund
- you do not owe
- legally required unless cite-specific

Use:
- may
- can
- helps
- potential
- estimated
- possible
- depends on provider/insurance review
- prepared for you to review and send

Do not redesign the section.
```

Why it worked:

- preserved conversion energy
- reduced legal/refund risk
- kept scope to copy

### Emotional UX Review Prompt

```text
Review this screen as a scared consumer who just paid for help with a medical bill.

Find anything that feels:
- generic
- fake
- too templated
- legally overconfident
- confusing
- like the product lost my case details
- like a button may not work

Suggest only trust-building fixes. No redesign.
```

Why it worked:

- evaluated the paid experience emotionally
- caught "generic dashboard" trust risk
- made personalization gaps obvious

### Letter/Packet Humanization Prompt

```text
Rewrite these patient-facing letters so they sound like a real patient making a clear written request.

Requirements:
- professional
- calm
- specific
- not legalistic unless necessary
- no fake attorney tone
- no guaranteed outcome
- includes provider, amount, date, coverage, payment status, and user's concern
- prepared for user to review, sign, and send
```

Why it worked:

- made letters feel usable
- avoided over-lawyering
- anchored output to intake fields

### Conversion Section Prompt

```text
Make this section more premium and conversion-focused without increasing legal risk.

The user should feel:
- this is specific to my bill
- I know what to do next
- the paid packet saves me time
- I am not being promised a guaranteed result

Keep the same layout and approximate length.
```

Why it worked:

- improved sales copy within constraints
- avoided new UI work

## 6. Best GPT Strategic Prompts

### Launch Priority Prompt

```text
We are launching this product to get first sales fast.

Audit what is truly required before launch versus what can wait.

Prioritize:
- revenue impact
- refund risk
- trust risk
- technical breakage
- legal/compliance risk

Give me:
1. must fix before launch
2. should fix soon
3. ignore until after first sales
```

Why it worked:

- separated launch blockers from polish
- preserved speed
- kept founder focused on money

### Monetization Prompt

```text
Think like a direct-response founder.

Given this product and current funnel, what are the fastest realistic paths to $500-$1,000 in the next 3 weeks?

Focus on:
- high-intent audiences
- low-cost traffic
- simple offers
- urgent pain
- Gumroad/digital product fit
- no backend required
```

Why it worked:

- kept product decisions tied to sales
- avoided SaaS overbuild

### Backend Timing Prompt

```text
Should we build backend now or after launch?

Evaluate:
- revenue speed
- refund risk
- implementation time
- trust impact
- support burden
- whether a static workaround is acceptable

Return a practical recommendation.
```

Why it worked:

- prevented premature backend build
- identified resume fallback as interim solution

## 7. Trust-Polish Workflows

Trust-polish is not visual polish. It is removing anything that makes a paid user doubt the product is real.

### Trust-Polish Checklist

Ask:

- Does every visible button do something real?
- Does the paid output use the user's exact intake?
- Does the product avoid showing demo/default data?
- Does every download use current restored/resumed state?
- Does the success page prevent blank dashboard entry?
- Does copy avoid guarantees?
- Does the user understand what is prepared versus what is verified?
- Does the user know what to do next?

### Trust-Polish Fix Order

1. Fix broken routes.
2. Fix payment return path.
3. Fix missing state restore.
4. Fix generic dashboard risk.
5. Fix fake/inert controls.
6. Fix misleading absolute copy.
7. Fix missing personalization fields.
8. Verify downloads and print/share.
9. Only then consider visual polish.

## 8. "Remove The Seams" Methodology

"Seams" are moments where the user can see the product is stitched together from static templates, browser state, Gumroad, and generated HTML.

### Common Seams

- Success page jumps to generic dashboard.
- PDF/email opens old dashboard.
- Button looks clickable but does nothing.
- User enters details that never appear again.
- Downloaded packet uses old/default data.
- Letter signature says placeholder instead of patient name.
- Copy promises analysis that the static system cannot perform.
- Payment flow feels disconnected from the intake.

### How To Remove Seams

1. Trace the user's exact journey.
2. Identify every handoff:
   - intake to analysis
   - analysis to preview
   - preview to Gumroad
   - Gumroad to success
   - success to dashboard
   - dashboard to packet/download
3. At each handoff, ask:
   - what data could be lost?
   - what does the user expect?
   - what happens if storage is empty?
   - what happens if a route is stale?
4. Add one of:
   - persistence
   - resume fallback
   - safer copy
   - hidden/removed control
   - real handler
   - visible case context

### The Best Seam-Removal Fixes In UPA

- `/success` routes to success page, not dashboard.
- `/success` pauses when no state exists.
- Resume Your Review rebuilds case before dashboard.
- Dashboard shows `Intake used` context.
- Download/print build the current tailored packet.
- Share explains same-device vs resume fallback.
- Night mode removed instead of pretending to work.

## 9. Intake-To-Output Mapping Strategy

Every intake question must earn its place.

### Rule

If the user enters it, it must appear or affect:

- dashboard
- packet
- letters
- scripts
- written requests
- action plan
- download filename
- case context
- review area selection

### Mapping Workflow

1. List intake fields.
2. Search where each field is stored.
3. Search where each field is read.
4. Search where each field appears visibly.
5. If missing:
   - wire into output, or
   - remove/soften the input question.
6. Add a visible `Intake used` summary when full mapping cannot be deeply customized yet.

### UPA Mapping Pattern

Fields:

- patient name -> signatures, packet, dashboard, filenames
- provider -> dashboard, letters, scripts
- amount -> dashboard, calculator, packet
- coverage -> EOB/rate letter, dashboard
- payment status -> next step posture
- service date -> letters and dashboard meta
- concerns -> findings, letter text, scripts
- free text -> user note
- upload -> specificity status
- email/phone -> packet contact context

## 10. Launch QA Workflows

### Static Handler Scan

Use when fake controls are a risk.

Workflow:

- extract all `onclick` handlers
- extract referenced function names
- verify each exists in inline script or loaded script
- ignore browser built-ins like `window.print`
- investigate missing functions

### Syntax Check

Use after every JS edit.

Workflow:

- run syntax check on changed `.js` files
- parse inline dashboard/success scripts with `new Function(...)`
- fail launch if syntax breaks

### Source/Public Parity Check

Use after every mirrored file edit.

Workflow:

- compare hashes of `UPA-Final/file` and `public/UPA-Final/file`
- if different unintentionally, mirror the deploy copy or source copy
- keep deployment source clear

### Route Check

Use before deploy.

Confirm:

- `/` -> landing
- `/success` -> success
- `/dashboard` -> dashboard
- `/upa-preview.html` -> preview
- static assets load

### Payment Flow Check

Manual path:

1. Complete intake.
2. Preview page should show personalized case.
3. Unlock CTA should mark checkout.
4. `/success` should restore state.
5. Dashboard should show same case.
6. Download packet should include same case.
7. Clear storage and open `/success`.
8. Resume form should show.
9. Resume submit should open personalized dashboard.

## 11. Emotional UX Review Framework

Review as the buyer, not the builder.

### Buyer Emotional State

The user is likely:

- anxious about a large bill
- suspicious of healthcare billing
- unsure what to say
- worried about collections
- afraid of making the wrong move
- looking for a clear next step

### Emotional UX Questions

Ask:

- Does this make me feel less alone?
- Does this give me one clear next action?
- Does this feel specific to my bill?
- Does this avoid sounding like a fake template?
- Does this explain uncertainty honestly?
- Does this avoid scaring me with unsupported legal claims?
- Does this make the paid product feel worth the money?

### Paid Experience Standard

After payment, the user should think:

> This is my case. My details are here. I know what to do next. The packet saves me time.

They should never think:

> This is a demo. It forgot my bill. These buttons are fake. I paid for a template.

## 12. Conversion/Trust Audit Framework

### Conversion Audit

Check:

- Is the pain obvious?
- Is the CTA clear?
- Is the value concrete?
- Does preview create curiosity?
- Does paid output feel more complete than free preview?
- Is the price justified by saved time and reduced confusion?
- Is there a direct path to checkout?

### Trust Audit

Check:

- Are claims believable?
- Are outputs case-specific?
- Are limitations clear?
- Are buttons real?
- Is payment return reliable?
- Are downloads real?
- Is there a fallback for lost state?

### Highest-Converting Trust Pattern

> "We prepared this for your case, but you review and send it. This helps you create a written record and request the documents needed before accepting the balance."

This sells usefulness without promising a result.

## 13. Copy Refinement Process

### Step 1: Identify Risky Claims

Search for:

- guaranteed
- must
- cannot
- legally required
- savings
- refund
- error
- illegal
- you do not owe

### Step 2: Replace With Safer Language

Use:

- may
- can
- helps
- possible
- potential
- estimated
- depends on provider/insurance review
- request written confirmation
- prepared for you to review and send

### Step 3: Keep Conversion Energy

Weak:

> This may or may not help.

Better:

> This gives you a clear written request path and helps you press for the records needed before accepting the balance.

### Step 4: Tie Copy To Intake

Generic:

> Your packet is ready.

Better:

> Your packet is organized around Metro Hospital, the $8,450 bill amount, Private Insurance, Not Paid Yet status, and your concern about duplicate ER charges.

## 14. Rapid Launch/Fix Loop

The loop that worked:

1. Identify launch blocker.
2. Define exact desired behavior.
3. Tell Codex "must-fix only."
4. Patch smallest surface area.
5. Mirror source/public.
6. Run syntax/static checks.
7. Verify route/state/control behavior.
8. Document exact files changed.
9. Move to next blocker.

### Do Not Mix These In One Prompt

Avoid combining:

- redesign
- mobile polish
- new features
- legal copy
- state persistence
- deployment routing
- business strategy

Why:

Mixed prompts slow execution and create regressions.

### Best Launch Sequencing

1. Routing.
2. Checkout/success flow.
3. State persistence.
4. Resume fallback.
5. Dashboard personalization.
6. Packet/download/print/share.
7. Legal copy softening.
8. Dead control audit.
9. Documentation.
10. Deployment verification.

## 15. Prompt Patterns That Produced Best Outputs

### Pattern: "Current Broken Flow / Required Fixed Flow"

```text
Current broken flow:
[step by step]

Required fixed flow:
[step by step]

Acceptance criteria:
[specific observable outcomes]

Do not redesign.
```

Why it works:

- gives AI a deterministic target
- reduces ambiguity
- makes verification obvious

### Pattern: "Do Not Touch Anything Else"

```text
Make only this change:
[specific change]

Do not touch anything else.
Do not redesign.
Do not add features.
Mirror source + public copies.
```

Why it works:

- prevents well-meaning overbuild
- protects launch stability

### Pattern: "Every Input Must Matter"

```text
Audit whether every user-entered field affects the final paid output.
If not, wire it into dashboard/packet/letters/scripts or remove/soften it.
```

Why it works:

- improves perceived value
- catches fake-intake risk

### Pattern: "Founder-Ready Documentation"

```text
Create a practical, structured, founder-ready markdown file.
Capture decisions, workarounds, known risks, and future ideal architecture.
The goal is to prevent future context loss.
```

Why it works:

- turns launch chaos into reusable IP

## 16. Prompts That Failed Or Wasted Time

### Too Broad

Bad:

```text
Audit everything and make it better.
```

Problem:

- creates scope creep
- mixes strategy, design, code, and QA
- hard to verify

Better:

```text
Audit only fake/inert paid dashboard controls. Fix or remove them. Do not redesign.
```

### Too Design-Focused Near Launch

Bad:

```text
Polish the mobile layout and improve the whole dashboard.
```

Problem:

- can create regressions
- delays launch blockers
- improves aesthetics before trust

Better:

```text
Do not do mobile polish yet. Fix only launch-blocking trust issues.
```

### Asking For Backend Too Early

Bad:

```text
Build accounts, database, PDF generation, upload OCR, and Gumroad webhooks.
```

Problem:

- too much before validation
- delays first sales

Better:

```text
Patch local/session state and add resume fallback. Document backend roadmap for after first revenue.
```

### Asking For Guaranteed-Sounding Copy

Bad:

```text
Make this sound like the user will save thousands.
```

Problem:

- legal/refund risk
- overpromises

Better:

```text
Keep conversion-focused tone but frame as potential reviewable amount depending on provider/insurance review.
```

## 17. Repo And Deployment Workflows

### File Discipline

UPA has two trees:

- `UPA-Final/`
- `public/UPA-Final/`

Rule:

If runtime file changes in one, mirror the other unless intentionally source-only documentation.

Documentation files can live only in `UPA-Final/` unless they must be deployed.

### Git/Vercel Discipline

Before deploy:

- check `vercel.json`
- check `.gitignore`
- check `.vercelignore`
- confirm no temp/preview artifacts deploy
- confirm public copy contains latest runtime files
- confirm GitHub branch is the Vercel deployment source

### Deployment Verification Prompt

```text
Check vercel.json routes, public/UPA-Final files, git status/commits, and Vercel deployment source.
Fix only stale deployment/version issue.
Do not redesign.
```

Why it works:

- focuses on live deployment mismatch
- prevents unrelated app changes

## 18. Future Automation Opportunities

### Launch QA Automation

Build script to verify:

- routes exist
- required files exist
- source/public hashes match
- no banned legal phrases
- no missing onclick handlers
- no Night/Review My Bill stale controls
- `/success` route points to success page
- download/print/share handlers exist

### Personalization Regression Tests

Create fixture intake:

```json
{
  "name": "Jane Patient",
  "provider": "Metro Hospital",
  "bill_amount": "$8,450",
  "insurance": "Private Insurance",
  "payment_status": "Not Paid Yet",
  "date_of_service": "2026-05-20",
  "concerns": "Duplicate charge, insurance denial",
  "description": "I was charged twice for the ER visit and insurance denied part of the claim.",
  "uploaded_bill": "itemized-bill.pdf"
}
```

Test that output includes:

- Jane Patient
- Metro Hospital
- $8,450
- Private Insurance
- Not Paid Yet
- May 20, 2026
- duplicate charge
- insurance denial
- itemized-bill.pdf

Across:

- dashboard
- packet
- letters
- written requests
- call scripts
- download HTML

### Prompt Library Automation

Create a prompt vault with:

- launch blocker fix prompt
- copy safety prompt
- trust audit prompt
- state persistence prompt
- personalization audit prompt
- deployment audit prompt
- documentation capture prompt
- clone-this-business prompt

### Backend Workflow Automation

Future AI-agent tasks:

- create Supabase schema
- add Gumroad webhook
- generate signed case tokens
- add magic-link login
- add server-side PDF generation
- add OCR pipeline
- add support dashboard

## 19. Reusable Framework For New Startups

### The 7-Day AI Product Launch Pattern

Day 1:

- choose painful niche
- write offer
- define paid deliverable

Day 2:

- build intake
- define output mapping
- draft preview/paywall

Day 3:

- build paid dashboard/packet
- create letters/scripts/templates

Day 4:

- wire payment
- add success/restore/resume flow

Day 5:

- trust polish
- legal copy pass
- fake control audit

Day 6:

- deploy
- test full flow
- create support docs

Day 7:

- drive traffic
- collect objections
- patch refund risks

### Best Niches For This Workflow

Use when customers have:

- urgent paperwork problem
- confusing rules
- high perceived stakes
- fear of saying the wrong thing
- need for letters/scripts/templates
- willingness to pay for clarity

Examples:

- medical bill dispute
- insurance denial appeal
- debt validation
- credit report dispute
- landlord deposit dispute
- warranty claim
- airline compensation
- financial aid appeal
- parking/toll dispute
- utility billing dispute

## 20. Speed Without Breaking Trust Lessons

### Lesson 1: Users Forgive Simple, Not Fake

A static app is acceptable if it is honest and useful.

They will not forgive:

- fake buttons
- lost data
- generic paid output
- unsupported claims

### Lesson 2: Resume Fallback Is Better Than Blank Dashboard

Asking users to re-enter details is not ideal, but it is better than showing a demo as their case.

### Lesson 3: Every Paid Output Needs A Case Anchor

Use:

- patient name
- provider
- amount
- coverage
- status
- concern
- service date

Repeated anchors make static generation feel personalized.

### Lesson 4: Copy Can Sell Uncertainty

You do not need guarantees. You can sell:

- clarity
- prepared documents
- written record
- next steps
- time saved
- reduced confusion

### Lesson 5: Documentation Is Product IP

The playbooks, prompts, risk register, and operating docs are reusable assets for future products.

## 21. Master Launch Prompt Template

Use this to start a new AI-assisted business build:

```text
You are my high-execution AI operator, startup engineer, CRO strategist, growth hacker, automation architect, and monetization partner.

Goal:
Launch a revenue-generating AI-assisted digital product as fast as possible without breaking user trust.

Product concept:
[describe niche/problem]

Target customer:
[describe urgent buyer]

Paid deliverable:
[dashboard/packet/documents/scripts/report/etc.]

Constraints:
- speed to revenue first
- no unnecessary backend before validation
- every intake answer must affect output
- no fake buttons
- no guaranteed outcome claims
- payment flow must restore or resume state
- document known limitations

Build sequence:
1. funnel
2. intake
3. preview/paywall
4. checkout
5. success/restore/resume
6. paid dashboard
7. downloadable packet
8. trust/copy QA
9. deployment QA
10. launch docs

Return:
- must-fix launch blockers
- implementation plan
- exact files changed
- verification steps
- future backend roadmap
```

## 22. Final Operating Rule

The most valuable AI workflow is not "generate more stuff."

It is:

> Use AI to compress strategy, creation, implementation, QA, and documentation into one fast loop while preserving user trust.

For future businesses, repeat the pattern:

1. Choose painful niche.
2. Build intake.
3. Create personalized paid output.
4. Sell with safe, specific copy.
5. Verify every control works.
6. Preserve state through payment.
7. Document risks.
8. Launch before overbuilding backend.
9. Let first sales dictate the roadmap.

