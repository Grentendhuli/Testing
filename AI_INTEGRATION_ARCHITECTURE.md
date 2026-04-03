# AI Integration Architecture
## Technical Design: AI as the Interface

**Date:** March 24, 2026  
**Status:** Architecture Specification  
**Version:** 1.0

---

## 🎯 Architecture Philosophy

### Core Principle
**The AI is not a feature bolted onto the app. The AI IS the app.**

Traditional architecture:  
`User → UI → API → Database → Response`  

AI-first architecture:  
`User → Natural Language → AI Parser → Action/Integration → Response`

### Key Design Decisions

1. **Conversational Interface First**
   - All actions can be triggered via chat
   - UI is secondary (still available for power users)
   - Voice input supported everywhere

2. **Intent-Based Routing**
   - AI classifies user intent
   - Routes to appropriate integration/action
   - Falls back to human if confidence < threshold

3. **Context-Aware**
   - AI remembers portfolio context
   - Maintains conversation history
   - Understands NYC-specific requirements

4. **Graceful Degradation**
   - If integration fails, AI explains and suggests alternatives
   - Never leave user stuck
   - Always path to human support

---

## 🏗️ System Architecture

### High-Level Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User      │────▶│  AI Router   │────▶│  Intent Parser  │
│  (Chat)     │     │  (NLP)       │     │  (Gemini)       │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                │
              ┌─────────────────────────────────┼─────────────────────────────────┐
              ▼                                 ▼                                 ▼
       ┌────────────┐                   ┌────────────┐                   ┌────────────┐
       │   Native   │                   │ Integration│                   │  External  │
       │   Actions  │                   │  Services  │                   │    APIs    │
       │            │                   │            │                   │            │
       │ • Create   │                   │ • DocuSeal │                   │ • QuickBks │
       │   Tenant   │                   │ • Stripe   │                   │ • Plaid    │
       │ • Log      │                   │ • Twilio   │                   │ • Calendar │
       │   Payment  │                   │ • Webhooks │                   │ • Yelp     │
       │ • Schedule │                   │            │                   │ • NYC Open │
       │   Maint.   │                   │            │                   │   Data     │
       └────────────┘                   └────────────┘                   └────────────┘
              │                                 │                                 │
              └─────────────────────────────────┼─────────────────────────────────┘
                                                ▼
                                       ┌─────────────────┐
                                       │   Response      │
                                       │   Generator   │
                                       │   (AI)         │
                                       └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │      User       │
                                       │   (Response)    │
                                       └─────────────────┘
```

---

## 🔧 Core Components

### 1. AI Router (Entry Point)

**File:** `src/services/ai-router.ts`

**Purpose:** Receives all user messages, routes to appropriate handler

**Process:**
```typescript
async function routeUserMessage(message: string, context: UserContext) {
  // 1. Enrich message with context
  const enrichedMessage = await enrichWithContext(message, context);
  
  // 2. Classify intent
  const intent = await classifyIntent(enrichedMessage);
  
  // 3. Check if integration required
  if (intent.requiresIntegration) {
    const integration = getIntegration(intent.integrationType);
    return await integration.execute(intent.parameters);
  }
  
  // 4. Execute native action
  return await executeNativeAction(intent);
}
```

---

### 2. Intent Parser (Gemini Integration)

**File:** `src/services/gemini.ts`

**Purpose:** Parse natural language into structured intent

**Input:**
```
"Send the lease to John for signing and let me know when he's done"
```

**Output:**
```json
{
  "intent": "send_document_for_signature",
  "confidence": 0.94,
  "entities": {
    "document_type": "lease",
    "recipient_name": "John",
    "recipient_lookup": "tenant_name",
    "service": "docuseal",
    "notify_on_complete": true
  },
  "requires_integration": true,
  "integration_type": "docuseal",
  "user_confirmation_required": false
}
```

**Prompt Template:**
```
Parse the following user message for a property management AI assistant.

Available intents:
- create_lease
- send_document_for_signature
- check_rent_status
- schedule_maintenance
- connect_accounting_software
- query_portfolio
- ...

User message: "{message}"

Context: {portfolio_context}

Return JSON with: intent, confidence, entities, requires_integration, integration_type
```

---

### 3. Integration Service Layer

**File:** `src/services/integrations.ts`

**Purpose:** Abstract all external integrations

```typescript
interface Integration {
  name: string;
  execute(params: any): Promise<IntegrationResult>;
  isAvailable(): boolean;
  getStatus(): IntegrationStatus;
}

class IntegrationManager {
  private integrations: Map<string, Integration>;
  
  async execute(integrationName: string, params: any): Promise<IntegrationResult> {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      return {
        success: false,
        error: `Integration ${integrationName} not found`
      };
    }
    
    if (!integration.isAvailable()) {
      return {
        success: false,
        error: `${integrationName} is not configured`,
        setupInstructions: this.getSetupInstructions(integrationName)
      };
    }
    
    return await integration.execute(params);
  }
}
```

---

## 🔌 Integration Patterns

### Pattern 1: OAuth Flow + Action

**Use Case:** QuickBooks connection

**Flow:**
```
1. User: "Connect my QuickBooks"
   AI: "I'll help you connect QuickBooks. [Connect button]"

2. User clicks → OAuth popup
   → Redirects to Intuit OAuth

3. User authorizes → Callback to /api/oauth/quickbooks/callback
   → Exchange code for tokens
   → Store encrypted tokens

4. AI imports properties
   → Calls QBO API: GET /company/{id}/query?query=SELECT * FROM Item
   → Maps QBO items to LandlordBot units

5. AI confirms
   "Connected! I've imported 12 properties from QuickBooks. 
   Future payments will sync automatically."

6. Webhook listener set up
   → Receives real-time updates from QBO
   → Updates LandlordBot records
```

**Code Pattern:**
```typescript
class QuickBooksIntegration implements Integration {
  async connect(): Promise<OAuthResult> {
    const authUrl = await this.generateAuthUrl();
    return { authUrl, state: this.generateState() };
  }
  
  async handleCallback(code: string, state: string): Promise<ConnectionResult> {
    const tokens = await this.exchangeCode(code);
    await this.storeTokens(tokens);
    const properties = await this.importProperties();
    return { connected: true, importedCount: properties.length };
  }
  
  async syncPayment(payment: Payment): Promise<SyncResult> {
    const qboCustomer = await this.findOrCreateCustomer(payment.tenant);
    const invoice = await this.createInvoice(qboCustomer, payment);
    return { invoiceId: invoice.Id };
  }
}
```

---

### Pattern 2: Embeddable Widget

**Use Case:** DocuSeal document signing

**Flow:**
```
1. User: "Send lease to John for signing"

2. AI prepares document
   → Fetches lease from database
   → Generates PDF from template
   → Creates DocuSeal submission

3. AI responds with options
   "I'll send the lease to John via DocuSeal.
   [Preview document] [Send now]"

4. If user clicks Preview
   → Embed DocuSeal preview widget
   → User reviews fields

5. User sends
   → API call to DocuSeal
   → Email sent to tenant
   → Webhook registered

6. AI tracks status
   → Waits for webhook callback
   → Updates database on completion
   → Notifies user: "John signed! Document filed in unit 3B."
```

**Code Pattern:**
```typescript
class DocuSealIntegration implements Integration {
  async sendForSignature(lease: Lease, tenant: Tenant): Promise<Submission> {
    const pdf = await this.generatePDF(lease);
    const submission = await this.createSubmission({
      template_id: this.leaseTemplateId,
      documents: [{ file: pdf }],
      submitters: [{ email: tenant.email, name: tenant.name }]
    });
    
    await this.registerWebhook(submission.id);
    return submission;
  }
  
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (payload.event === 'completed') {
      await this.markLeaseSigned(payload.submission_id);
      await this.notifyLandlord(payload);
    }
  }
}
```

---

### Pattern 3: API Proxy (User Auth)

**Use Case:** Plaid (bank account verification)

**Flow:**
```
1. User: "Set up bank payments for Sarah"

2. AI initiates Plaid Link
   "I'll send Sarah a secure link to connect her bank account."

3. Server creates Link token
   → Calls Plaid /link/token/create
   → Returns link_token

4. AI sends Link to tenant
   → Email/SMS with Plaid Link URL
   → Or embeds in tenant portal

5. Tenant authenticates
   → Uses Plaid Link UI
   → Selects bank, enters credentials
   → Success → Plaid sends public_token to callback

6. Exchange for access_token
   → Server calls /item/public_token/exchange
   → Stores access_token securely

7. Verify and confirm
   "Sarah's Chase account ending in 4242 is verified. 
   ACH payments are now enabled."
```

**Code Pattern:**
```typescript
class PlaidIntegration implements Integration {
  async createLinkToken(userId: string): Promise<string> {
    const response = await fetch('https://sandbox.plaid.com/link/token/create', {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        user: { client_user_id: userId },
        client_name: 'LandlordBot',
        products: ['auth', 'transactions'],
        country_codes: ['US'],
        language: 'en'
      })
    });
    const data = await response.json();
    return data.link_token;
  }
  
  async exchangePublicToken(publicToken: string): Promise<string> {
    const response = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        public_token: publicToken
      })
    });
    const data = await response.json();
    return data.access_token; // Store securely
  }
}
```

---

### Pattern 4: Webhook-Driven

**Use Case:** Zapier, custom webhooks

**Flow:**
```
1. User configures Zapier
   → LandlordBot provides webhook URL
   → User selects trigger (e.g., "Rent Late")
   → User selects action (e.g., "Send Slack message")

2. Event occurs
   → Rent marked overdue in LandlordBot
   → Database triggers webhook

3. Webhook sent
   → POST to Zapier webhook URL
   → Includes: tenant info, amount, days late, unit

4. Zapier processes
   → Formats for Slack
   → Posts to #rent-collection channel

5. Confirmation
   → LandlordBot logs webhook delivery
   → Shows in activity feed: "Notified Slack #rent-collection"
```

**Code Pattern:**
```typescript
class WebhookManager {
  async triggerEvent(event: string, payload: any): Promise<void> {
    const webhooks = await this.getSubscribedWebhooks(event);
    
    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LandlordBot-Signature': this.generateSignature(payload)
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload
          })
        });
      } catch (error) {
        await this.logFailedWebhook(webhook, error);
        await this.retryLater(webhook, event, payload);
      }
    }
  }
  
  generateSignature(payload: any): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
```

---

## 🗣️ Conversation Flow Examples

### Example 1: QuickBooks Integration

```
User: Connect my QuickBooks

AI: I'll help you connect QuickBooks Online. This lets me:
• Import your properties as units
• Sync tenant payments automatically
• Generate tax-ready reports

[Connect QuickBooks button]

→ (User clicks, OAuth flow)
→ (Returns, authorization successful)

AI: Successfully connected! 🎉
I found 12 properties in your QuickBooks account:
• 123 Main St (residential) - imported as Unit 1
• 456 Oak Ave (residential) - imported as Unit 2
• ...

Your existing tenants have been matched (3/12 matched).
Would you like me to help you add the remaining tenants?

User: Yes, who isn't matched?

AI: Here are the unmatched properties:
• 789 Pine St (no tenant info in QBO)
• 321 Elm Ave (tenant: "TBD")

Want me to help you add tenant details to these?
```

---

### Example 2: Maintenance + Vendor

```
User: The tenant in 2B says the sink is leaking

AI: 📸 I'll help you handle this. Can you ask them to send a photo?

→ (AI sends message to tenant: "Can you send a photo of the leak?")

→ (Tenant sends photo)

AI: Photo received. Looking at this, it appears to be a minor faucet leak 
(under $100 repair). I can either:

[Call handyman - $75 estimated]
[Schedule plumber - $150 estimated]
[DIY instructions - $15 parts]

Your preferred handyman Mike has fixed 3 similar issues 
with average cost of $72. Want me to message him?

User: Yes, ask him to come Tuesday

AI: ✓ Message sent to Mike's Handyman:
"Hi Mike, need faucet repair at 123 Main St Unit 2B. 
Available Tuesday? Tenant available all day."

I'll let you know when he replies. Want me to add 
this to your calendar for Tuesday just in case?
```

---

### Example 3: Complex Multi-Step

```
User: Send the renewal lease to the Smiths and remind them 
it's due by the 15th

AI: I'll handle the lease renewal for Unit 3B (Smiths). Let me:

1. ✓ Found lease ending April 30 — 36 days to renewal
2. Checking NYC compliance for rent increase...
   ✓ Building has 12 units — not subject to Good Cause Eviction
   ✓ 3.5% increase is within guidelines
3. Preparing renewal letter...

[Preview renewal document]

Includes:
• New rent: $2,585 (up from $2,500 — 3.5%)
• 12-month renewal option
• Response due: March 15, 2026

Ready to send to Smiths?

User: Yes, send it

AI: ✓ Renewal sent via email and DocuSeal for e-signature.

📧 Email sent to: j.smith@email.com
• Subject: Lease Renewal - 456 Oak Ave Unit 3B
• Response due: March 15 (3 weeks)
• DocuSign link included

I'll follow up automatically:
• Week before due date: Reminder email
• Day after due date: "Response needed" email
• 3 days after: Phone call reminder to you

Want me to also text them?
```

---

## 🛡️ Error Handling

### Integration Failure Response

**Scenario:** QuickBooks sync fails

```typescript
// System logs error
console.error('QuickBooks sync failed:', error);

// AI generates user-friendly response
const errorResponse = await generateErrorResponse(error, {
  integration: 'quickbooks',
  action: 'payment_sync',
  userFriendly: true
});

// Response to user:
"I wasn't able to sync that payment to QuickBooks right now 
(it looks like their API is having issues). 

Don't worry — I've saved the payment and will retry automatically 
in 15 minutes. You'll get a notification when it syncs.

[View unsynced payments] [Retry now] [Contact support]"
```

**Error Categories:**

| Error Type | AI Response | Escalation |
|------------|-------------|------------|
| **Transient** (API down) | "Having trouble connecting. Retrying in 15 min." | Log, auto-retry |
| **Auth** (Token expired) | "Your QuickBooks connection expired. [Reconnect]" | Immediate user action |
| **Validation** (Data mismatch) | "This payment doesn't match your QuickBooks tenant record. [Review]" | User review required |
| **Fatal** (Integration broken) | "QuickBooks sync is temporarily unavailable. Our team has been notified." | Alert engineering |

---

## 📊 Architecture Benefits

### For Users
- **Natural interface:** Talk, don't click
- **Contextual help:** AI knows your specific situation
- **Proactive suggestions:** "You haven't synced QuickBooks in 3 days"
- **Unified experience:** One chat for everything

### For Developers
- **Modular integrations:** Add new integrations without touching core
- **Testable:** Each integration can be unit tested
- **Observable:** Clear tracing: user → intent → integration → result
- **Fallbacks:** If one integration fails, suggest alternative

### For Business
- **Upgrade path:** Integrations map to Pro features
- **Retention:** Connected integrations = higher switching costs
- **Data:** Every interaction teaches us user intent patterns
- **Competitive:** "It just works" vs "configure these 12 settings"

---

## 🚀 Implementation Phases

### Phase 1: Core AI Router (Week 1)
- [ ] Intent parser service
- [ ] Basic action routing
- [ ] Native actions (CRUD operations)
- [ ] Context enrichment

### Phase 2: First Integration (Week 2)
- [ ] DocuSeal integration refine
- [ ] Webhook handlers
- [ ] Status tracking
- [ ] Error handling patterns

### Phase 3: Accounting Integration (Week 3-4)
- [ ] QuickBooks OAuth flow
- [ ] Two-way sync
- [ ] Conflict resolution
- [ ] Reconciliation UI

### Phase 4: Payment Integrations (Week 5-6)
- [ ] Plaid bank verification
- [ ] Stripe payment sync
- [ ] Twilio SMS fallback
- [ ] Payment failure handling

### Phase 5: Advanced Integrations (Month 3+)
- [ ] Calendar sync
- [ ] Zapier webhooks
- [ ] Vendor APIs
- [ ] NYC Open Data

---

## 📚 API Reference

### Intent Response Format
```typescript
interface IntentResponse {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  requires_integration: boolean;
  integration_type?: string;
  user_confirmation_required: boolean;
  suggested_response: string;
  action?: {
    type: string;
    parameters: Record<string, any>;
  };
}
```

### Integration Result Format
```typescript
interface IntegrationResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    user_message: string;
    retryable: boolean;
    setup_instructions?: string;
  };
  metadata?: {
    duration_ms: number;
    integration: string;
    action: string;
  };
}
```

---

**Key Insight:** When architecture makes the AI the primary interface, every integration becomes a capability the user can discover through conversation. No documentation needed — just ask.
