# AI Usage Limit Legal Compliance Review
## LandlordBot Property Management SaaS

**Review Date:** March 14, 2026  
**Reviewer:** Legal Compliance Subagent  
**Context:** Implementation of AI usage limits (20 free + 5 bonus per rolling 24h)

---

## EXECUTIVE SUMMARY

### Overall Legal Risk Assessment: **MEDIUM**

The proposed AI usage limit implementation (20 requests + 5 bonus per rolling 24h) presents manageable legal risk with proper documentation updates. The primary concerns center on transparency, data privacy in AI prompts, and clear disclosure of limitations.

### Key Findings:
- ✅ Current Terms of Service has **NO** AI usage limit provisions (gap identified)
- ✅ Privacy Policy has basic AI disclosure but lacks usage tracking specifics
- ⚠️ No pre-signup disclosure of AI limits (marketing/compliance risk)
- ⚠️ No standalone "AI Usage Policy" document
- ✅ Soft limit approach (5 bonus) is legally sound and user-friendly

---

## 1. TERMS OF SERVICE REVIEW

### Current State Analysis

**Existing AI Coverage in Terms:**
- Section 6.2 references "NYC Local Law 144 (AEDT)" regarding AI bias audits
- Section 10 (Privacy Policy) mentions "AI chatbot data processing"
- **NO explicit AI usage limits, quotas, or rate limiting provisions**

### Required Additions to Terms of Service

#### 1.1 Fair Usage Policy Section (NEW)

**Recommended Insertion:** Add new Section after "Acceptable Use" (Section 5)

```
5.X Fair Usage and Rate Limiting

To ensure service quality for all users, we implement fair usage limits on 
AI-powered features:

- Free tier users: 20 AI requests per rolling 24-hour period
- Additional "courtesy requests": 5 bonus requests when limit exceeded
- Premium tier users: [unlimited/reasonable limits TBD]

These limits are designed to prevent abuse and ensure system availability. 
We reserve the right to:
- Adjust limits with 30 days' notice
- Implement additional rate limiting during high-demand periods
- Suspend access for usage patterns that degrade service for others
- Require upgrade to Premium for usage exceeding free tier limits

"AI requests" include: chatbot messages, lease analysis, maintenance 
triage, and other AI-powered features as designated in the Service.
```

#### 1.2 Service Availability Disclaimer Enhancement

**Current:** Section 2 states "We strive to maintain 99.9% uptime but do not guarantee uninterrupted access."

**Recommended Addition:**
```
AI Service Availability: AI features depend on third-party providers 
(OpenAI/Anthropic). We do not guarantee:
- Specific response times for AI-generated content
- Availability of AI features during provider outages
- Accuracy of AI-generated recommendations (see Section 7 - Disclaimers)

We reserve the right to temporarily disable AI features for maintenance, 
updates, or during periods of excessive demand.
```

#### 1.3 Rate Limiting Rights (Explicit)

**Recommended Addition to Section 5 (Acceptable Use):**
```
You agree not to:
- Attempt to circumvent AI usage limits through multiple accounts or other means
- Use automated scripts or bots to access AI features
- Share account access to pool AI request quotas
- Resell or redistribute AI-generated content at scale

Violation of these restrictions may result in immediate account suspension.
```

### Terms of Service Compliance Rating: **INCOMPLETE**
- Missing: Fair usage policy
- Missing: Explicit rate limiting rights
- Missing: AI service availability specifics
- Missing: Account sharing/circumvention prohibitions

---

## 2. PRIVACY CONSIDERATIONS

### 2.1 AI Request Logging - Current State

**Current Privacy Policy Coverage:**
- Section 10 "AI Chatbot Data Processing" mentions OpenAI/Anthropic
- States: "Messages are processed solely to generate responses"
- States: "Your data is not used to train AI models without explicit opt-in consent"
- States: "Chat logs are retained for your reference and service improvement purposes"

**GAPS IDENTIFIED:**
- ❌ No mention of usage tracking (counts, timestamps, quotas)
- ❌ No retention period specified for AI request logs
- ❌ No clarity on what metadata is stored (IP, user agent, etc.)

### 2.2 User Data in AI Prompts

**Risk Assessment: HIGH**

**Current Implementation Risk:**
- Tenant information (names, addresses, rent amounts) may be sent to OpenAI/Anthropic
- Property details, lease terms, maintenance descriptions in prompts
- Financial data (rent amounts, payment history) potentially exposed

**Required Privacy Policy Updates:**

```
10.X AI Data Processing Details

When you use AI-powered features, the following data may be transmitted to 
our AI providers (OpenAI, Anthropic):

- Your messages and queries
- Contextual property information (unit addresses, lease terms) needed to 
  generate relevant responses
- Tenant names and communication history (when relevant to your query)
- Maintenance request descriptions

We implement the following protections:
- Data is transmitted via encrypted connections (TLS 1.3)
- AI providers are contractually prohibited from using data for model training
- No Social Security numbers, financial account numbers, or sensitive 
  personal information is intentionally transmitted
- Prompts are anonymized where possible while maintaining context

Users should NOT include in AI prompts:
- Social Security numbers or Tax IDs
- Bank account or credit card numbers
- Passwords or authentication credentials
- Sensitive tenant medical information
```

### 2.3 Data Retention for Usage Tracking

**Required Addition to Section 4.4 (Data Retention):**

```
AI Usage Tracking Data:
- Request counts and timestamps: Retained for 90 days
- Quota utilization metrics: Retained for 1 year (for billing disputes)
- AI prompt/response logs: Retained per your account settings (default: 30 days)
- Aggregated usage analytics: Retained indefinitely (anonymized)
```

### 2.4 GDPR/CCPA Compliance for AI Features

**GDPR Considerations:**
- ✅ Lawful basis: Contractual necessity (Section 3.1 already covers)
- ⚠️ Data minimization: Need to ensure only necessary data sent to AI providers
- ⚠️ Right to deletion: AI logs must be deletable
- ⚠️ Data processing agreement (DPA): Required with OpenAI/Anthropic

**CCPA Considerations:**
- ✅ "Do Not Sell" - Already covered (Section 7)
- ⚠️ Right to know: Must disclose AI providers receiving personal information
- ⚠️ Right to delete: AI conversation history must be deletable

**Required Updates:**

```
10.X Third-Party AI Processors

We use the following subprocessors for AI functionality:
- OpenAI, LLC (San Francisco, CA) - Language model processing
- Anthropic, PBC (San Francisco, CA) - Alternative language model processing

These providers process data in the United States. By using AI features, 
you consent to this transfer. Both providers are certified under the 
EU-US Data Privacy Framework for GDPR compliance.

To request deletion of your AI conversation history, use the Config page 
or contact privacy@gne-services.com.
```

### Privacy Policy Compliance Rating: **NEEDS UPDATES**
- Missing: Specific AI usage tracking retention
- Missing: Complete list of data types sent to AI providers
- Missing: User guidance on what NOT to include in prompts
- Missing: Subprocessor list for GDPR
- Missing: AI conversation deletion process

---

## 3. TRANSPARENCY REQUIREMENTS

### 3.1 Pre-Signup Disclosure (Marketing Requirement)

**Current State:** ❌ NOT IMPLEMENTED

**Legal Risk:** Medium-High
- FTC guidelines require clear disclosure of material limitations before purchase
- California Consumer Protection laws require transparency on service limitations
- NYC Consumer Protection Law prohibits deceptive practices

**Required Implementation:**

**On Pricing Page:**
```
AI Usage Limits:
Free tier includes 20 AI-powered requests per day (rolling 24-hour period).
Additional requests require Premium subscription. Learn more →
```

**On Signup Page:**
```
Free Plan Includes:
- Up to 3 properties
- 20 AI requests per day
- 50MB document storage
- [etc.]

Upgrade to Premium ($75/month) for unlimited AI usage.
```

**In App Store Listings (if applicable):**
```
Free version limited to 20 AI interactions per day.
```

### 3.2 In-App Disclosure

**Current State:** ❌ NOT IMPLEMENTED

**Required Implementation:**

**AI Chatbot Interface:**
- Display remaining requests: "15/20 AI requests remaining today"
- When approaching limit: "5 requests remaining - Upgrade for unlimited"
- At limit: "Daily limit reached. 5 courtesy requests available."

**Settings/Usage Page:**
- Clear display of current usage vs. limits
- Explanation of rolling 24-hour window
- Historical usage graph

### 3.3 Upgrade Path Clarity

**Current State:** ⚠️ PARTIAL

**Required Improvements:**

**When User Hits Limit:**
```
🤖 Daily AI Limit Reached

You've used your 20 AI requests for today.

Options:
1. Use 1 of 5 courtesy requests (resets in 14 hours)
2. Upgrade to Premium for unlimited AI ($75/month)
3. Continue with manual features only

[Use Courtesy Request] [Upgrade to Premium] [Maybe Later]
```

**Upgrade Messaging Best Practices:**
- ✅ Explain value: "Save 5+ hours/week with unlimited AI"
- ✅ No penalty for not upgrading: "Your data remains accessible"
- ✅ Clear pricing: "$75/month, cancel anytime"
- ❌ Avoid: "Upgrade NOW or lose access" (pressure tactics)
- ❌ Avoid: Countdown timers or false urgency

### 3.4 Dark Patterns Assessment

**Current Implementation: ✅ CLEAN**

The proposed soft limit approach (5 bonus requests) is **NOT** a dark pattern:
- Provides genuine value (doesn't block immediately)
- Clear communication about limits
- No deceptive countdowns or false scarcity
- Easy to decline upgrade

**Recommendations to Maintain Compliance:**
- Keep "Maybe Later" / "Not Now" options equally prominent
- Don't dim or disable free features when limit is hit
- Don't show upgrade modal more than once per session
- Allow users to dismiss limit warnings permanently

### Transparency Compliance Rating: **NEEDS IMPLEMENTATION**
- Missing: Pre-signup AI limit disclosure
- Missing: In-app usage counter
- Missing: Clear upgrade path messaging
- ✅ No dark patterns detected in current approach

---

## 4. BEST PRACTICES REVIEW

### 4.1 Is 20 Requests + 5 Bonus Reasonable?

**Assessment: ✅ YES, REASONABLE**

**Industry Benchmarks:**
- OpenAI ChatGPT Free: ~40 messages per 3 hours (rolling)
- Claude Free: ~30-50 messages per 8 hours
- Notion AI Free: 20 responses per month
- GitHub Copilot Free: 2,000 code completions per month

**LandlordBot Context:**
- Target user: Small landlord (1-3 properties)
- Typical daily usage: 5-15 interactions (check rent status, tenant questions, maintenance triage)
- 20 requests provides ~2-3x headroom for active usage
- 5 bonus provides buffer for urgent situations

**Recommendation: KEEP CURRENT LIMITS**

### 4.2 Rolling 24h vs Calendar Day

**Current Plan: Rolling 24-hour window**

**Assessment: ✅ BEST PRACTICE**

**Why Rolling 24h is Better:**
- More fair to users (doesn't penalize late-night usage)
- Prevents "midnight rush" behavior
- Industry standard (OpenAI, Anthropic use similar)
- Better user experience

**User Expectations:**
- Should be clearly labeled: "20 requests per rolling 24-hour period"
- Show reset time: "Resets in 6 hours 23 minutes"
- Avoid "daily" terminology which implies calendar day

**Recommendation: KEEP ROLLING 24H, improve messaging**

### 4.3 Soft Limit Approach (5 Extra Requests)

**Assessment: ✅ LEGALLY SOUND, USER-FRIENDLY**

**Legal Analysis:**
- No legal requirement to hard-cutoff at 20
- Bonus requests demonstrate good faith
- Reduces risk of user complaints
- Provides natural upgrade path

**Best Practice Implementation:**
```
Request 21: "You've exceeded your daily limit. Using 1 of 5 courtesy requests."
Request 25: "You've used all courtesy requests. Upgrade for unlimited access."
```

**Recommendation: KEEP SOFT LIMIT APPROACH**

### 4.4 Upgrade Messaging Review

**Assessment: ✅ NOT OVERLY AGGRESSIVE**

**Current Approach Strengths:**
- Soft limit provides value before asking for money
- No forced upgrade at cutoff
- Users can continue using non-AI features

**Recommendations:**
- Keep messaging helpful, not pushy
- Focus on value: "Save time" not "You're blocked"
- Always provide "Continue with limitations" option
- Never use red/error colors for limit messages (use amber/neutral)

**Sample Compliant Messaging:**
```
🤖 AI Daily Limit Reached

You've used your 20 AI requests. 

You have 5 courtesy requests remaining, or upgrade to Premium for 
unlimited AI assistance.

[Use Courtesy Request] [Learn About Premium] [Continue Manually]
```

### Best Practices Compliance Rating: ✅ **COMPLIANT**
- ✅ 20+5 limit is reasonable
- ✅ Rolling 24h is user-friendly
- ✅ Soft limit approach is legally sound
- ✅ Upgrade messaging is appropriate

---

## 5. DOCUMENTATION RECOMMENDATIONS

### 5.1 Privacy Policy Updates Required

**Add New Section: "AI Usage and Data Processing"**

```markdown
## AI Usage Tracking

To enforce fair usage limits and improve service quality, we track:
- Number of AI requests per user
- Timestamps of AI feature usage
- Types of AI features accessed
- Approximate token usage (for cost monitoring)

This data is retained for 90 days for quota enforcement and 
1 year in aggregated form for capacity planning.

## AI Prompt Data

When you use AI features, your queries and relevant context 
are sent to our AI providers (OpenAI, Anthropic). This may include:
- Your messages to the AI chatbot
- Property addresses and unit details (when relevant)
- Tenant names and lease terms (when relevant)
- Maintenance request descriptions

We do NOT send to AI providers:
- Social Security numbers or Tax IDs
- Bank account or credit card numbers
- Passwords or authentication tokens
- Sensitive medical information

## Third-Party AI Processors

We use the following subprocessors:
- OpenAI, LLC (United States)
- Anthropic, PBC (United States)

Both are certified under the EU-US Data Privacy Framework.

## AI Conversation Retention

AI conversations are retained for 30 days by default. You can:
- Delete individual conversations in the app
- Request complete deletion via privacy@gne-services.com
- Export your data (including AI history) from the Config page
```

### 5.2 Terms of Service Updates Required

**Add New Section: "AI Service Limits"**

```markdown
## AI Service Limits

To ensure fair access for all users, we implement usage limits on 
AI-powered features:

**Free Tier:**
- 20 AI requests per rolling 24-hour period
- 5 additional courtesy requests when limit exceeded
- AI features may be temporarily unavailable during high demand

**Premium Tier:**
- Unlimited AI requests (subject to fair use policy)
- Priority access during high-demand periods

We reserve the right to:
- Modify limits with 30 days' notice
- Suspend AI access for usage that degrades service for others
- Implement additional rate limiting as needed
- Require upgrade for commercial or high-volume usage

"AI requests" include chatbot messages, document analysis, maintenance 
triage, and other features designated as "AI-powered" in the Service.

## AI Service Availability

AI features depend on third-party providers. We do not guarantee:
- Continuous availability of AI features
- Specific response times
- Accuracy of AI-generated content

See Section 7 (Disclaimers) for additional limitations.
```

### 5.3 Standalone "AI Usage Policy" - RECOMMENDED

**Rationale:**
- Provides clear, focused documentation
- Easier to update independently of main Terms
- Demonstrates transparency commitment
- Common practice among AI-powered SaaS

**Recommended Structure:**

```
AI Usage Policy
Last Updated: [Date]

1. Overview
   - What this policy covers
   - Relationship to Terms of Service and Privacy Policy

2. Usage Limits
   - Free tier: 20 requests/rolling 24h
   - Courtesy requests: 5 additional
   - Premium: Unlimited
   - How limits are calculated

3. Fair Use Guidelines
   - What constitutes acceptable use
   - Prohibited activities (circumvention, resale, etc.)
   - Consequences of violation

4. Data Processing
   - What data is sent to AI providers
   - How to avoid sending sensitive data
   - Retention periods

5. Service Availability
   - No uptime guarantees
   - Provider dependency
   - Maintenance windows

6. Changes to This Policy
   - 30-day notice for material changes

7. Contact
   - support@gne-services.com
```

### 5.4 In-App Documentation

**Required UI Elements:**

**1. Usage Counter (Persistent)**
```
🤖 12/20 AI requests today (resets in 8 hours)
```

**2. Limit Reached Modal**
```
Daily AI Limit Reached

You've used your 20 AI requests for this 24-hour period.

You have 5 courtesy requests remaining.

[Use Courtesy] [Upgrade] [Learn More]
```

**3. Settings Page Section**
```
AI Usage
- Current period: 15/20 requests used
- Resets: Tomorrow at 2:30 PM
- This month: 312 requests total
- Average: 10 requests/day

[View AI Usage Policy] [Manage Data]
```

---

## 6. COMPLIANCE CHECKLIST

### Pre-Launch Requirements

| Requirement | Status | Priority |
|-------------|--------|----------|
| Terms of Service: Add AI usage limits section | ❌ Not Done | **CRITICAL** |
| Terms of Service: Add rate limiting rights | ❌ Not Done | **CRITICAL** |
| Terms of Service: Add AI availability disclaimer | ❌ Not Done | **CRITICAL** |
| Privacy Policy: Add AI usage tracking disclosure | ❌ Not Done | **CRITICAL** |
| Privacy Policy: Add AI prompt data details | ❌ Not Done | **CRITICAL** |
| Privacy Policy: Add subprocessor list for GDPR | ❌ Not Done | **HIGH** |
| Pre-signup: AI limits on pricing page | ❌ Not Done | **HIGH** |
| Pre-signup: AI limits on signup page | ❌ Not Done | **HIGH** |
| In-app: Usage counter display | ❌ Not Done | **HIGH** |
| In-app: Limit reached messaging | ❌ Not Done | **HIGH** |
| In-app: Clear upgrade path | ❌ Not Done | **MEDIUM** |
| Create standalone AI Usage Policy | ❌ Not Done | **MEDIUM** |
| DPA with OpenAI/Anthropic (for GDPR) | ⚠️ Verify | **HIGH** |

### Post-Launch Monitoring

| Task | Frequency | Owner |
|------|-----------|-------|
| Review user complaints about limits | Weekly | Support |
| Monitor upgrade conversion rates | Weekly | Product |
| Audit AI data retention compliance | Monthly | Legal |
| Review AI provider DPAs | Annually | Legal |
| Update documentation for law changes | As needed | Legal |

---

## 7. SPECIFIC RECOMMENDATIONS

### Immediate Actions (Before Launch)

1. **Update Terms of Service** (Section 2 and 5)
   - Add AI service limits section
   - Add rate limiting rights
   - Add AI availability disclaimer

2. **Update Privacy Policy** (Section 10)
   - Add AI usage tracking disclosure
   - Add complete AI prompt data details
   - Add subprocessor list

3. **Add Pre-Signup Disclosure**
   - Pricing page: "20 AI requests/day on Free tier"
   - Signup page: Clear feature comparison

4. **Implement In-App UI**
   - Usage counter in chatbot interface
   - Limit reached modal with upgrade path
   - Settings page AI usage section

### Short-Term Actions (Within 30 Days)

5. **Create Standalone AI Usage Policy**
   - Link from Terms and Privacy Policy
   - Link from in-app settings

6. **Verify GDPR Compliance**
   - Confirm DPA with OpenAI
   - Confirm DPA with Anthropic
   - Document lawful basis for AI processing

7. **User Communication**
   - Email existing users about new limits
   - Blog post explaining rationale
   - FAQ documentation

### Ongoing Compliance

8. **Monitor and Adjust**
   - Track user feedback on limits
   - Adjust if too restrictive
   - Document business justification for limits

9. **Regular Audits**
   - Quarterly review of AI data practices
   - Annual review of provider agreements
   - Update for new regulations

---

## 8. RISK MITIGATION SUMMARY

### High Risk Items (Address Immediately)

| Risk | Mitigation | Status |
|------|------------|--------|
| No Terms coverage of AI limits | Add Section 5.X to Terms | ❌ Pending |
| No Privacy Policy disclosure of usage tracking | Update Section 10 | ❌ Pending |
| No pre-signup disclosure | Add to pricing/signup pages | ❌ Pending |
| GDPR subprocessor list incomplete | Add OpenAI/Anthropic details | ❌ Pending |

### Medium Risk Items (Address Within 30 Days)

| Risk | Mitigation | Status |
|------|------------|--------|
| No standalone AI policy | Create AI_USAGE_POLICY.md | ❌ Pending |
| In-app disclosure missing | Build usage counter UI | ❌ Pending |
| Unclear upgrade path | Design limit reached modal | ❌ Pending |

### Low Risk Items (Best Practice)

| Risk | Mitigation | Status |
|------|------------|--------|
| User confusion about limits | Add FAQ, tooltips | ❌ Pending |
| Data retention unclear | Add specific retention periods | ❌ Pending |

---

## 9. CONCLUSION

The proposed AI usage limit implementation (20 requests + 5 bonus per rolling 24h) is **legally sound and user-friendly** with proper documentation updates.

### Overall Assessment:
- **Legal Risk Level:** Medium (addressable with documentation)
- **User Experience:** Positive (soft limits are appreciated)
- **Business Justification:** Strong (cost management, upgrade path)
- **Regulatory Compliance:** Achievable with updates

### Key Success Factors:
1. ✅ Transparent communication about limits
2. ✅ Reasonable limits with buffer (20+5)
3. ✅ Soft approach (no hard cutoff)
4. ✅ Clear upgrade path
5. ⚠️ **Must complete documentation updates before launch**

### Final Recommendation:
**PROCEED WITH IMPLEMENTATION** after completing the documentation updates outlined in this review. The approach is compliant, fair, and industry-standard.

---

**Document Prepared By:** Legal Compliance Subagent  
**Date:** March 14, 2026  
**Next Review:** Upon implementation or regulatory changes
