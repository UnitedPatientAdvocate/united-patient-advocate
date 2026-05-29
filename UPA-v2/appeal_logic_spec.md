# UPA v2 — Denial Appeal System — Technical Spec

## Overview
Extension of UPA v1. Same AI backend (api/analyze.js), new input type, new output type.

## Input
- Denial letter PDF (uploaded by user)
- Optional: EOB, original claim, doctor notes

## Processing (api/appeal.js — to be created)
1. Extract denial reason code (ICD/CPT/HCPCS + denial code)
2. Look up insurer's clinical criteria for that code (criteria database)
3. Identify strongest grounds for appeal:
   a. Medical necessity (most common)
   b. Experimental/investigational (second most common)
   c. Not covered (plan document analysis)
   d. Administrative (wrong code, wrong billing, authorization issues)
4. Generate appeal letter citing:
   - Specific ACA/state law protections
   - Insurer's own published clinical criteria
   - Placeholder for physician statement
5. Generate call script for peer-to-peer review request
6. Calculate appeal deadline (180 days from denial date)
7. Identify external appeal pathway for user's state

## Output
- appeal_letter.pdf — complete internal appeal letter
- physician_statement_template.docx — for doctor to sign
- appeal_tracker.html — deadline + status tracker
- call_script.txt — what to say when calling
- external_appeal_guide.md — state-specific instructions

## Insurer Criteria Database (v4 moat)
Location: /api/data/insurer-criteria/
Format: JSON per insurer per procedure code
Sources: Publicly available LCD/NCD policies, insurer medical policy portals
Update frequency: Quarterly
Initial coverage: Top 10 insurers × top 50 denial codes = 500 entries

## State Commissioner Forms Database
Location: /api/data/state-appeals/
Format: One entry per state with:
- External appeal form URL
- Filing deadline
- Required attachments
- Contact information
All 50 states + DC

## Integration with v1
New route: POST /api/appeal
Same pattern as POST /api/analyze
New Gumroad product: separate SKU at $67

## Status
NOT YET DEPLOYED. File created for planning only.
Deploy trigger: First UPA v1 sale confirmed.
