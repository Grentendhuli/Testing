# LandlordBot Freemium Strategy Map
## Detailed Feature Breakdown & Implementation Plan

**Date:** February 21, 2026  
**Prepared for:** LandlordBot Team

---

## 📊 PRICING STRUCTURE

### FREE TIER
- **Cost:** $0/month
- **Target:** New landlords, 1-3 properties, testing the platform
- **Goal:** Get users hooked, create upgrade pressure

### PREMIUM TIER  
- **Cost:** $75/month (your current price)
- **Target:** Growing landlords, 4+ properties, want automation
- **Goal:** Scale with user, save them time/money

---

## FREE TIER FEATURES (Barebones)

### ✅ Core Essentials (Always Free)

**1. Dashboard & Activity Feed**
- View recent bot activity
- Basic stats (messages this month, leads qualified)
- Trial countdown

**2. Unit Management (Max 3 Properties)**
- Add/edit units manually
- Basic unit details (address, rent, bedrooms)
- Unit status (occupied/vacant)
- **UPGRADE TRIGGER:** "You've reached 3 properties. Upgrade for unlimited units"

**3. Tenant/Leases (Basic)**
- Manual lease entry (tenant name, dates, rent amount)
- No smart features
- **UPGRADE TRIGGER:** Shows "AI Lease Analyzer" tease button → "Upgrade to unlock AI"

**4. Payment Tracking (Manual)**
- Log payments by hand
- View payment history
- **LIMITATION:** No automated late fees, must click "Mark as paid"

**5. Maintenance Requests (Text Only)**
- Tenants submit basic text requests
- View request history
- **UPGRADE TRIGGER:** Shows "Add Photo" button → "Photos require Premium"

**6. Document Storage (50MB Limit)**
- Upload leases, receipts
- **LIMITATION:** Storage bar shows usage → "85% full. Upgrade for unlimited"

**7. Simple Reports**
- Current month only
- Basic CSV export
- **UPGRADE TRIGGER:** "Yearly reports, tax exports available in Premium"

**8. Messaging (Read-Only)**
- View bot conversations
- **LIMITATION:** Cannot send messages from dashboard

---

## PREMIUM TIER FEATURES ($75/month)

### 🔥 AUTOMATION LAYER

**1. Automated Late Fees**
- Set custom grace period (e.g., 5 days)
- Auto-apply % or flat fee
- Automatically notifies tenant
- **Value:** Saves hours of manual work monthly

**2. Smart Reminders**
- Lease renewal alerts (90/60/30 days)
- COI (Certificate of Insurance) expiring
- Warranty expirations
- Inspection dates
- Tax filing deadlines

---

### 🤖 AI POWERED FEATURES

**3. AI Lease Analyzer**
- Upload ANY PDF lease
- Auto-extracts: rent amount, dates, security deposit, renewal terms
- Flags unusual clauses
- Creates alerts for important dates
- **Value:** Saves 30 min per lease review

**4. Smart Maintenance Triage**
- AI reads tenant description
- Categorizes: Emergency / Urgent / Routine
- Suggests: Professional vs Handyman vs DIY
- Auto-assigns to vendor based on trade
- **Value:** Reduces unnecessary emergency calls

**5. Tenant Happiness Score**
- Tracks response times
- Analyzes tenant communication tone
- Predicts renewal likelihood 90 days out
- Alerts for "at risk" tenants
- **Value:** Proactive retention vs reactive

**6. Rent-Ready Photo Compare**
- Move-in and move-out photo upload
- AI side-by-side comparison
- Highlights damage/changes
- Generates deposit deduction report
- **Value:** Reduces deposit disputes

---

### 💼 POWER FEATURES

**7. Photo/Video Uploads**
- Tenants attach photos to maintenance requests
- Shows damage severity
- Reduces "can you send a pic?" back-and-forth
- **This is HUGE - TurboTenant doesn't do this**

**8. Vendor/Contractor Management**
- Track favorite vendors by trade (plumber, electrician, handyman)
- Store rates, contact info, response times
- See average cost per repair type
- Log vendor performance (5-star rating)
- **Value:** Never lose a good handyman's number again

**9. Bulk Operations**
- Send rent reminders to ALL tenants
- Apply late fees to multiple units at once
- Mark multiple units as paid
- Mass export reports
- **Value:** Saves 5-10 minutes per month per property

**10. Unlimited Everything**
- Unlimited properties
- Unlimited document storage
- Unlimited maintenance requests
- Unlimited reports

---

### 📈 ADVANCED REPORTING

**11. Financial Dashboard**
- Monthly/Yearly rent rolls
- Expense tracking by unit
- True ROI per property
- Tax-ready exports (Schedule E format)
- Occupancy rates, turnover costs

**12. Communication Templates**
- Pre-written responses:
  - "Your lease renewal offer..."
  - "Late rent notice"
  - "Maintenance scheduled..."
  - "Security deposit return..."
- One-click send

**13. Voice Commands**
- "Show me units with late rent"
- "What's my occupancy rate?"
- "How much rent did I collect this month?"
- Works with Alexa/Google Home

---

## 🎣 UPGRADE TRIGGERS (The Hooks)

### Hard Limits
1. **Property Cap**
   - Free: 3 properties max
   - Display: "3/3 units used. Upgrade for unlimited"
   - On 4th add attempt: Modal → "Upgrade to Premium"

2. **Storage Cap**
   - Free: 50MB (~10-15 PDFs)
   - Show progress bar: "45MB/50MB used (90%)"
   - At 100%: "Storage full. Upgrade for unlimited"

3. **Report Timeframe**
   - Free: Current month only
   - Premium button grayed: "Yearly reports available in Premium"

### Feature Teases
1. **Photo Upload Button**
   - Visible on maintenance form
   - Click → Modal: "Photo uploads require Premium. They help you diagnose issues faster."
   - Shows example: Before vs After

2. **AI Lease Analyzer**
   - Big button on leases page
   - Click → "Unlock AI analysis. Upload any lease and we'll extract all key terms automatically."
   - Shows demo of extracted data

3. **Automated Late Fees**
   - Settings page shows checkbox "Automatically apply late fees"
   - Grayed with lock icon
   - Hover: "Premium feature"

4. **Vendor Management**
   - Side menu item "Vendors"
   - Click → "Track your contractors in one place. Upgrade to unlock."

---

## 📦 IMPLEMENTATION PHASES

### Phase 1: Beta Launch (Week 1-2)
**Goal:** Get feedback, validate concept

**Build:**
- ✅ All Free tier features (already done!)
- ✅ Property limit (3 max)
- ✅ Storage limit (50MB)
- ✅ Basic maintenance (text only)
- ✅ "Upgrade" teasers/banners

**Don't Build Yet:**
- Automated late fees (manual works for now)
- AI features (too complex for beta)
- Vendor management (nice-to-have)

---

### Phase 2: Premium Launch (Month 1-2)
**Goal:** Start converting free → paid

**Build Priority Order:**

**Priority 1 - Immediate Revenue Impact:**
1. **Photo Uploads for Maintenance**
   - Why: Huge differentiator, TurboTenant doesn't have this
   - Effort: Medium (need file upload, storage)
   - Impact: HIGH

2. **Automated Late Fees**
   - Why: Every landlord wants this
   - Effort: Low (cron job + logic)
   - Impact: HIGH

3. **Remove Property Limit**
   - Why: Growing landlords hit wall at 3 units
   - Effort: Low (just remove check)
   - Impact: HIGH

**Priority 2 - Stickiness Features:**
4. **Vendor Management**
   - Why: Organizes their life, hard to leave once data is in
   - Effort: Medium
   - Impact: MEDIUM

5. **Bulk Operations**
   - Why: Saves massive time
   - Effort: Medium
   - Impact: MEDIUM

**Priority 3 - The "Wow" Factor:**
6. **AI Lease Analyzer**
   - Why: Unique differentiator, marketing gold
   - Effort: HIGH (need AI integration, PDF parsing)
   - Impact: MEDIUM (cool, but not daily use)

7. **Smart Maintenance Triage**
   - Why: Saves decision fatigue
   - Effort: HIGH (need AI model)
   - Impact: MEDIUM

---

### Phase 3: Scale (Month 3+)
**Goal:** Enterprise features, higher retention

**Build:**
8. Tenant Happiness Score
9. Photo Compare Tool
10. Voice Commands
11. Advanced Reporting/Tax exports
12. Communication Templates
13. Smart Reminders

---

## 💰 REVENUE OPTIMIZATION

### Free → Premium Conversion Points

**Natural Triggers:**
1. Adding 4th property (37% of users will hit this)
2. Storage full (uploading lease docs)
3. Tenant sends photo with maintenance request
4. Want automated late fees
5. First tax season (need yearly reports)

**In-App Prompts:**
- "You're managing 3 properties like a pro! Ready to scale?"
- "Your storage is 85% full. Upgrade for unlimited docs."
- "Add photos to maintenance requests? Upgrade to Premium"

### Pricing Psychology
- **$75/month** anchors vs Buildium ($58-166)
- Show "Save X hours/month" calculator
- Annual discount: $750/year (2 months free)
- 30-day money back guarantee

---

## 🎯 SUCCESS METRICS

**Free Tier:**
- Signup conversion rate: Target 15%
- Active users (weekly): Target 60%
- Upgrade rate: Target 10-15% within 90 days

**Premium Tier:**
- Monthly churn: Target <5%
- Expansion revenue: Multi-unit landlords upgrade
- Net Promoter Score: >50

---

## 📧 NEXT STEPS

1. **This Week:**
   - Add property limit (3 max) to free tier
   - Add storage limit (50MB)
   - Create "Upgrade" banner/modals

2. **Week 2:**
   - Build photo upload feature
   - Build automated late fees
   - Test upgrade flow

3. **Week 3:**
   - Launch Premium tier
   - Monitor conversion
   - Collect feedback

4. **Month 2:**
   - Build vendor management
   - Build bulk operations
   - AI features (if resources allow)

---

## 📝 NOTES

**Why This Works:**
- Free tier is genuinely useful (not crippled)
- Premium saves actual time/money
- Clear upgrade path at natural growth points
- NYC-specific compliance = moat vs generic competitors

**Competitive Position:**
- TurboTenant: Free but basic (we beat them on features)
- RentRedi: Cheap but crashes (we beat them on reliability)
- Buildium: Expensive for small landlords (we're $75 flat)
- AppFolio: Overkill for <50 units (we're simple)

---

**Questions or want to adjust priorities? Let me know!**

