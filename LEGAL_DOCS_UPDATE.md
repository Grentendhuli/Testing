# Legal Documents Update - February 22, 2026
## NYC-Focused Compliance Package

### Overview
All legal documents have been restructured to focus on **New York City operations** as the primary market, with comprehensive NYC-specific compliance provisions.

---

## Files Updated

### 1. TermsOfService.tsx (NYC-Focused)
**Location:** `src/pages/TermsOfService.tsx`

#### NYC-Specific Additions:
- **Banner**: "New York City Operations" - prominent NYC focus statement
- **Jurisdiction**: Changed from Nassau County to **New York County** (NYC courts)
- **Service Description**: Explicitly calls out "New York City landlords and property managers"
- **NYC Features Listed**:
  - NYC Department of Housing Preservation & Development (HPD) compliance
  - NYC Housing Court documentation support
  - FARE Act compliance
  - Good Cause Eviction protection
  - Rent Stabilization monitoring

- **Tax Section**: Added NYC sales tax disclosure (8.875%)
- **NYC Local Law 144 (AEDT)**: AI bias audit requirements for NYC
- **Contact**: "Registered in New York State, operating primarily in New York City"

#### NYC Laws Referenced:
- NYC Human Rights Law (Admin Code § 8-101)
- NYC FARE Act (Local Law 24 of 2023)
- NYC Local Law 144 (AEDT - AI bias audits)
- NYC Rent Stabilization and Rent Control laws
- NYC Department of Consumer and Worker Protection (DCWP) regulations

---

### 2. PrivacyPolicy.tsx (NYC-Focused)
**Location:** `src/pages/PrivacyPolicy.tsx`

#### NYC-Specific Additions:
- **Banner**: "New York City Operations" with GNE Services LLC intro
- **Compliance Laws Extended**:
  - NYC Consumer Protection Law (Title 20, Chapter 5)
  - NYC Human Rights Law (Title 8)
  - NYC Local Law 144 (AEDT)

- **NYC FARE Act Disclosure**:
  - Extended explanation of criminal history restrictions
  - "Conditional offer" requirement highlighted
  - Amber warning box for emphasis

- **Data Types Specific to NYC**:
  - HPD registration numbers
  - Rent Stabilization status
  - Good Cause thresholds
  - NYC-licensed vendor information

- **Data Storage**: AWS US-East-1 (N. Virginia) and US-East-2 (Ohio) specified
- **NYC Consumer Protection Rights**: Specific DCWP protections listed
- **NYC Local Law 144 (AEDT) Section** (NEW):
  - Bias audit requirements
  - Public disclosure obligations
  - Alternative process opt-out
  - Notice requirements

- **Contact Section**: NYC DCWP contact information added

#### NYC Contacts Listed:
- NYS Attorney General (Internet Bureau)
- NYC Department of Consumer and Worker Protection (42 Broadway)

---

### 3. EULA.tsx (NYC-Focused)
**Location:** `src/pages/EULA.tsx`

#### NYC-Specific Additions:
- **Banner**: "New York City Operations" focus
- **License Scope**: "Licensed for use by New York City landlords and property managers"
- **Geographic Limitation Clause**: Explicitly states NYC/NYS focus with acknowledgment of limited features outside jurisdiction
- **NYC-Specific Restrictions**:
  - No violation of NYC HPD regulations
  - No violation of Rent Stabilization codes

- **Compliance Warranty** expanded:
  - NYC DCWP regulations
  - HPD registration requirements
  - DHCR registration for rent-stabilized units

- **Jurisdiction**: New York County (NYC courts)
- **Indemnification**: Updated to include NYC FARE Act and Rent Stabilization claims

---

## Routing
All three documents accessible at:
- `/terms` - Terms of Service (NYC-focused)
- `/privacy` - Privacy Policy (NYC-focused)
- `/eula` - End User License Agreement (NYC-focused)

## Build Status
✅ **SUCCESS**
- Bundle: 534KB (126KB gzipped)
- No TypeScript errors
- All imports resolved

## NYC Compliance Checklist

### NYC Local Laws Covered:
- ✅ **Local Law 24 of 2023 (FARE Act)** - Fair Chance for Housing
- ✅ **Local Law 144 of 2021 (AEDT)** - AI bias audits for landlords
- ✅ **Consumer Protection Law** - Title 20, Chapter 5
- ✅ **Human Rights Law** - Title 8 protections

### NYC Agencies Referenced:
- ✅ NYC Department of Housing Preservation & Development (HPD)
- ✅ NYC Department of Consumer and Worker Protection (DCWP)
- ✅ NYC Housing Court
- ✅ NYC Department of Investigation (DOI)
- ✅ Division of Housing and Community Renewal (DHCR)
- ✅ Rent Guidelines Board

### NYC Courts:
- ✅ New York County (Manhattan) - Civil and Supreme Court
- ✅ Housing Court jurisdiction

## Business Contact Information

**Entity:** GNE Services LLC (New York LLC)
**Location:** Williston Park, NY 11596
**Primary Market:** New York City landlords and property managers
**Registration:** New York State LLC

**Emails:**
- support@gne-services.com
- legal@gne-services.com
- privacy@gne-services.com

## Tax Notice
All documents include NYC sales tax disclosure (currently 8.875%):
- NY State: 4%
- NYC Local: 4.5%
- MCTD: 0.375%
- **Total: 8.875%**

## Recommended Footer Links
Update your footer component to include:
```tsx
<Link to="/terms">Terms of Service</Link>
<Link to="/privacy">Privacy Policy</Link>
<Link to="/eula">License Agreement</Link>
<span>© {new Date().getFullYear()} GNE Services LLC</span>
<span>Serving NYC Landlords</span>
```

## Data Storage Note
Documents specify AWS US-East-1 (N. Virginia) and US-East-2 (Ohio) as primary data centers - close to NYC without being in the city for redundancy advantages.

## Next Steps for Full NYC Compliance
1. Consider adding HPD registration number field to property setup
2. Add DHCR rent stabilization lookup tool
3. Implement email notifications for:
   - Rent guideline board annual increases
   - FARE Act deadline alerts
   - HPD violation tracking
4. Add NYC Housing Court form autofill
5. Consider NYC Local Law 18 (language access) for multilingual support
6. Add NYC COVID-19 emergency tenant protections monitoring (if still applicable)

## Disclaimer
While these documents are comprehensive for NYC operations, consult a **New York-licensed attorney** before production deployment to ensure full compliance with current NYC Administrative Code provisions.
