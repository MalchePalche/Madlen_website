# GDPR Compliance & Data Processing Agreements — NOEM Studio

This document records the data processors used by NOEM Studio, the personal data
we collect, the legal basis and retention for that data, the user rights we have
implemented, and the outstanding actions required from the business owner.

Keep this document up to date whenever a new third-party processor is added or a
processing purpose changes.

---

## 1. Data processors & DPAs

The following third parties process personal data on our behalf. Each requires a
signed/accepted Data Processing Agreement (DPA).

| Processor | Purpose | DPA | How to accept |
|-----------|---------|-----|---------------|
| **Supabase** | Database & authentication | https://supabase.com/privacy | Supabase dashboard → Settings → Legal |
| **Vercel** | Hosting & delivery | https://vercel.com/legal/dpa | Accepted automatically via their Terms of Service |
| **Resend** | Transactional email | https://resend.com/legal/dpa | Resend dashboard → accept the DPA |

---

## 2. Data collected by the site

| Data | Purpose |
|------|---------|
| Name | Order fulfillment |
| Phone | Order fulfillment |
| Address | Order fulfillment |
| City | Order fulfillment |
| Postcode | Order fulfillment |
| Email (optional) | Account creation / order confirmation |
| Order history | Account records & order management |

---

## 3. Legal basis for processing

| Processing activity | Legal basis (GDPR Art. 6) |
|---------------------|---------------------------|
| Order fulfillment (name, phone, address, city, postcode) | Contractual necessity — Art. 6(1)(b) |
| Account data (email, saved profile) | Consent — Art. 6(1)(a) |

---

## 4. Retention periods

| Data | Retention |
|------|-----------|
| Order data | 5 years — required by Bulgarian accounting law |
| Account data | Retained until the user requests deletion |

---

## 5. User rights implemented

| Right | Status | Implementation |
|-------|--------|----------------|
| Right to access | ✅ Implemented | Account page displays all data held about the user |
| Right to deletion | ✅ Implemented | Delete-account feature removes the user's data |
| Right to rectification | ✅ Implemented | Account page allows the user to edit their data |
| Right to portability | ⏳ Not implemented | Low priority — no machine-readable export yet |

---

## 6. Pending actions for the business owner

- [ ] Accept Supabase DPA in the Supabase dashboard (Settings → Legal)
- [ ] Accept Resend DPA in the Resend dashboard
- [ ] Fill in `[ЕИК]` and `[АДРЕС]` in the legal pages
- [ ] Set `[ДАТА]` on both legal pages once finalized

---

_Legal pages: `app/poveritelnost` (Privacy Policy) and `app/obshti-usloviya`
(Terms of Service)._
