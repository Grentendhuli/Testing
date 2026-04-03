# AI Legal Guardrails Implementation Report

## Overview

This document details the implementation of legal guardrails for the AI Landlord Assistant to prevent the AI from giving legal advice while remaining helpful to users.

## Problem Statement

- Landlords frequently ask about NYC housing law, eviction procedures, and compliance
- AI can hallucinate laws or provide outdated advice
- Legal liability risk if AI gives incorrect advice that users act upon
- Need to balance helpfulness with safety

## Solution Architecture

### 1. Legal Question Detection (`aiGuardrails.ts`)

**File:** `src/services/aiGuardrails.ts`

#### Keyword-Based Detection
The system uses two tiers of keyword detection:

**Standard Legal Keywords (50+ terms):**
- Basic legal terms: `law`, `legal`, `rights`, `attorney`, `lawyer`
- Court-related: `court`, `judge`, `hearing`, `summons`, `warrant`
- Eviction-related: `eviction`, `holdover`, `squatter`, `notice`, `3-day`, `7-day`
- Compliance: `compliance`, `violation`, `illegal`, `hpd violation`
- NYC-specific: `dhcr`, `rent control`, `rent stabilization`, `certificate of occupancy`
- Housing codes: `building code`, `housing maintenance code`, `heat requirements`
- Tenant rights: `repair and deduct`, `rent withholding`, `warranty of habitability`

**High-Risk Keywords (15+ terms):**
- Immediate legal action: `evict`, `eviction`, `sue`, `suing`, `lawsuit`
- Court proceedings: `court`, `summons`, `warrant`, `marshal`
- High-stakes situations: `holdover`, `squatter`, `lockout`, `discrimination`, `retaliation`

#### Detection Functions

```typescript
isLegalQuestion(question: string): boolean
isHighRiskLegalQuestion(question: string): boolean
detectLegalCategory(question: string): string | null
```

### 2. Safe Response Templates

Pre-approved responses for common legal questions ensure consistent, accurate information:

| Topic | Template Coverage |
|-------|-------------------|
| Eviction Process | General steps + attorney recommendation |
| Lease Compliance | Checklist + attorney review suggestion |
| Heat Requirements | Official HPD guidelines + links |
| Security Deposits | Rules + return timeline + deductions |
| Rent Increases | Stabilized vs market-rate guidelines |
| HPD Violations | Class A/B/C explanation + correction process |
| Squatter Situations | Immediate actions + what NOT to do |
| Fair Housing | Protected classes + legal screening |

Each template includes:
- General information only
- Links to official resources where applicable
- Clear recommendation to consult an attorney
- Warning about acting without legal counsel

### 3. Disclaimer System

**Standard Disclaimer:**
```
⚠️ I'm an AI assistant, not an attorney. This is general information only. 
For legal advice specific to your situation, please consult a qualified 
landlord-tenant lawyer.
```

**High-Risk Disclaimer:**
```
🚨 IMPORTANT LEGAL NOTICE 🚨

This question involves legal matters that could significantly impact your 
rights and obligations.

⚠️ I'm an AI assistant, not an attorney. The information provided is general 
in nature and may not apply to your specific situation.

Laws vary by jurisdiction and change frequently. Always consult a qualified 
landlord-tenant attorney before taking any legal action.
```

### 4. Integration with Gemini Service

**Updated Functions:**

#### `askLandlordAssistant()`
- Accepts new `userTier` parameter
- Applies guardrails before processing
- Logs legal questions for review
- Returns `legalDisclaimer` and `escalationOffered` in response
- Wraps AI responses with appropriate disclaimer
- Uses safe templates when available

#### `draftLandlordLetter()`
- Analyzes letter purpose for legal implications
- Adds disclaimers to legally-sensitive letters
- Flags eviction notices and lease violation letters
- Suggests attorney review for high-risk correspondence

#### `generateText()`
- Applies guardrails to general text generation
- Adds disclaimers to legal content

### 5. Concierge Tier Escalation

**Human Escalation Flow:**

1. **Detection:** Concierge user asks legal question
2. **Ticket Creation:** `createLegalReviewTicket()` generates ticket ID
3. **Logging:** Question logged with user ID, tier, timestamp
4. **User Offer:** AI offers to connect with legal partner
5. **Follow-up:** Ticket available for compliance team review

**Escalation Message:**
```
As a Concierge member, you have access to our legal partner network. 
Would you like me to connect you with a landlord-tenant attorney for 
personalized advice on this matter?
```

### 6. Enhanced System Prompt

When legal questions are detected, the AI receives an enhanced system prompt:

```
You are a helpful AI assistant for landlords. 

IMPORTANT: You are NOT a lawyer. Never give legal advice. 

When asked about laws, legal procedures, or compliance:
1. Provide general information only
2. Always recommend consulting an attorney
3. Do not provide specific legal strategies or tactics
4. Do not interpret laws or predict legal outcomes
5. Direct users to official government resources when available

Focus on:
- General best practices
- Administrative processes
- Document organization
- Communication templates
- Resource referrals

Avoid:
- Specific legal advice
- Predicting court outcomes
- Recommending specific legal actions
- Interpreting statutes or regulations
```

### 7. Logging and Monitoring

**Log Entry Format:**
```typescript
{
  timestamp: string;
  userId: string;
  tier: string;
  question: string; // truncated to 500 chars
  isHighRisk: boolean;
  flagged: true;
}
```

**Logged to:** Console (production: Sentry, DataDog, or similar)

## API Changes

### Updated Response Type

```typescript
interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  quotaStatus?: AIQuotaStatus;
  warning?: string;
  legalDisclaimer?: string;        // NEW
  escalationOffered?: boolean;     // NEW
}
```

### New Function Signatures

```typescript
askLandlordAssistant(
  question: string,
  context: PortfolioContext,
  history: GeminiMessage[],
  userId?: string,
  userTier: string = 'free'        // NEW parameter
): AsyncResult<AIResponse<string>, AppError>

draftLandlordLetter(
  purpose: string,
  tenantName: string,
  unitNumber: string,
  details: string,
  userId?: string,
  userTier: string = 'free'        // NEW parameter
): AsyncResult<AIResponse<string>, AppError>

generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
  userId?: string,
  userTier: string = 'free'        // NEW parameter
): AsyncResult<AIResponse<string>, AppError>
```

## Test Coverage

**Test File:** `src/services/__tests__/aiGuardrails.test.ts`

### Test Categories:

1. **Detection Tests**
   - Eviction question detection
   - Court-related question detection
   - Compliance question detection
   - Case insensitivity
   - Non-legal question filtering

2. **Risk Classification Tests**
   - High-risk vs standard legal questions
   - Proper categorization by topic

3. **Template Tests**
   - All 8 templates return valid content
   - Template selection based on keywords
   - Null return for unrecognized questions

4. **Disclaimer Tests**
   - Standard disclaimer format
   - High-risk disclaimer format
   - Proper wrapping of responses

5. **Integration Tests**
   - Guardrail application flow
   - Escalation logic for concierge tier
   - Category detection accuracy

## Usage Examples

### Basic Usage (Free Tier)

```typescript
const result = await askLandlordAssistant(
  "How do I evict a tenant?",
  portfolioContext,
  [],
  userId,
  "free"
);

// Response includes:
// - Safe eviction template
// - Standard legal disclaimer
// - escalationOffered: false
```

### Concierge Tier with Escalation

```typescript
const result = await askLandlordAssistant(
  "My tenant is suing me for discrimination",
  portfolioContext,
  [],
  userId,
  "concierge"
);

// Response includes:
// - High-risk disclaimer
// - escalationOffered: true
// - Offer to connect with legal partner
// - Ticket created for human review
```

### Non-Legal Question

```typescript
const result = await askLandlordAssistant(
  "What color should I paint the living room?",
  portfolioContext,
  [],
  userId,
  "free"
);

// Response includes:
// - Normal AI response
// - No legal disclaimer
// - escalationOffered: false
```

## Security Considerations

1. **Input Sanitization:** All inputs sanitized before guardrail processing
2. **Prompt Injection Detection:** Existing injection detection applied before legal analysis
3. **No Legal Advice:** System designed to never provide specific legal advice
4. **Audit Trail:** All legal questions logged for compliance review
5. **Template Safety:** Pre-approved templates prevent AI hallucination of laws

## Future Enhancements

1. **Machine Learning Classification:** Replace keyword detection with trained model
2. **Jurisdiction Detection:** Auto-detect user location for relevant laws
3. **Real-Time Law Updates:** Integration with legal databases for current regulations
4. **Attorney Network:** Direct connection to vetted landlord-tenant attorneys
5. **Compliance Calendar:** Automated reminders for legal deadlines

## Files Modified/Created

| File | Action | Description |
|------|--------|-------------|
| `src/services/aiGuardrails.ts` | Created | Core guardrail functions and templates |
| `src/services/gemini.ts` | Modified | Integrated guardrails into AI functions |
| `src/services/__tests__/aiGuardrails.test.ts` | Created | Comprehensive test suite |
| `AI_LEGAL_GUARDRAILS.md` | Created | This implementation report |

## Coordination with Team 1

This implementation works alongside Team 1's tier limit system:

- **Team 1** handles: Rate limiting, quota enforcement, tier restrictions
- **Team 2 (this)** handles: What happens when legal questions are asked within those limits

When a user hits a rate limit AND asks a legal question:
1. Team 1's limit check triggers first
2. If within limits, Team 2's guardrails apply
3. Response includes both quota warnings and legal disclaimers

## Compliance Notes

- All legal responses include attorney consultation recommendation
- High-risk questions receive prominent warnings
- Concierge users offered direct legal partner connection
- Complete audit trail of all legal question interactions
- No specific legal advice or outcome predictions provided
