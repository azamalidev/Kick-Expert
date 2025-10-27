# 🏦 Complete Withdrawal Process Documentation

## Overview
This document outlines the complete withdrawal flow in the Kick Expert platform, from user request through final payout.

---

## 📋 Table of Contents
1. [User Withdrawal Request Flow](#user-withdrawal-request-flow)
2. [KYC Verification Process](#kyc-verification-process)
3. [Admin Review & Approval](#admin-review--approval)
4. [Payment Processing](#payment-processing)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Error Handling](#error-handling)
8. [Security & Compliance](#security--compliance)

---

## User Withdrawal Request Flow

### Step 1: User Initiates Withdrawal Request

**Location**: User Dashboard → Wallet/Credits Section

**User Actions**:
1. User clicks "Request Withdrawal" button
2. User enters withdrawal amount (minimum $20 USD)
3. User selects payment method:
   - **Stripe** (default, uses connected Stripe account)
   - **PayPal** (requires PayPal email)

**Validation**:
- Amount must be ≥ $20
- Amount must not exceed user's available winnings credits
- User must have winnings credits (not purchased credits)

### Step 2: KYC Verification Check

**Location**: Frontend → `components/CreditManagement.tsx` (Withdrawal Tab)

**Process**:
```
User Clicks "Request Withdrawal"
        ↓
Check: Does user have KYC verified?
        ↓
    ┌───────────────────────────────────┐
    │                                   │
  YES                                  NO
    │                                   │
    ↓                                   ↓
Continue to        Redirect to KYC
Withdrawal Form    Verification Process
    │                                   │
    │                    ┌──────────────┘
    │                    │
    └────────────────────┘
           ↓
    Proceed with Withdrawal
```

**KYC Status Check**:
- Query `user_payment_accounts` table
- Check `kyc_status` field:
  - `'verified'` → Allow withdrawal
  - `'pending'` → Show "Verification in progress" message
  - `'unverified'` → Redirect to KYC process

### Step 3: KYC Verification (If Needed)

**Location**: `/kyc-verification` page

**Process**:
1. User is redirected to KYC verification page
2. User provides identity information:
   - Full name
   - Date of birth
   - Address
   - Government ID (photo)
   - Proof of address
3. System creates/updates `user_payment_accounts` record
4. Verification request sent to Stripe Connect (for Stripe) or third-party KYC provider
5. KYC status updated:
   - `'pending'` → Waiting for verification
   - `'verified'` → Approved, can proceed
   - `'rejected'` → Failed, user must retry

**Database Update**:
```sql
UPDATE user_payment_accounts
SET kyc_status = 'pending',
    onboarding_url = '<stripe_onboarding_url>',
    updated_at = now()
WHERE user_id = '<user_id>';
```

### Step 4: Submit Withdrawal Request

**API Endpoint**: `POST /api/withdrawals`

**Request Body**:
```json
{
  "amount": 50,
  "method": "stripe",  // or "paypal"
  "paypal_email": "user@example.com"  // Required if method is paypal
}
```

**Backend Process** (`app/api/withdrawals/route.ts`):

1. **Validate Request**:
   - Check authorization token
   - Validate amount (≥ $20)
   - Validate payment method

2. **Verify KYC Status**:
   ```typescript
   const { data: paymentAccount } = await supabase
     .from('user_payment_accounts')
     .select('*')
     .eq('user_id', user.id)
     .maybeSingle();
   
   if (paymentAccount?.kyc_status !== 'verified') {
     return error('KYC verification required');
   }
   ```

3. **Check Winnings Credits Balance**:
   ```typescript
   const { data: credits } = await supabase
     .from('user_credits')
     .select('winnings_credits')
     .eq('user_id', user.id)
     .single();
   
   if (credits.winnings_credits < amount) {
     return error('Insufficient winnings credits');
   }
   ```

4. **Atomic Transaction** (using `create_withdrawal_request` function):
   - Lock user's credits row
   - Deduct `winnings_credits` by withdrawal amount
   - Create `withdrawals` record with status `'pending'`
   - Create `credit_transactions` record for audit trail
   - All or nothing (ACID compliance)

5. **Response**:
   ```json
   {
     "ok": true,
     "withdrawal_id": "uuid-here"
   }
   ```

**Database Changes**:
```sql
-- user_credits table
UPDATE user_credits
SET winnings_credits = winnings_credits - 50,
    updated_at = now()
WHERE user_id = '<user_id>';

-- withdrawals table
INSERT INTO withdrawals (
  id, user_id, amount, currency, status, 
  provider, provider_account, requested_at, updated_at
) VALUES (
  'uuid', '<user_id>', 50, 'USD', 'pending',
  'stripe', '<provider_account>', now(), now()
);

-- credit_transactions table
INSERT INTO credit_transactions (
  id, user_id, amount, credit_type, transaction_type, 
  payment_method, status, created_at, updated_at
) VALUES (
  'uuid', '<user_id>', 50, 'winnings', 'withdrawal_request',
  'stripe', 'pending', now(), now()
);
```

---

## KYC Verification Process

### Detailed KYC Flow

```
User Needs KYC
        ↓
Check: Does user have payment account?
        ↓
    ┌───────────────────────────────────┐
    │                                   │
  YES                                  NO
    │                                   │
    ↓                                   ↓
Get Onboarding URL      Create Payment Account
from Stripe Connect     & Get Onboarding URL
    │                                   │
    └───────────────────┬───────────────┘
                        ↓
            Redirect to Stripe Onboarding
                        ↓
        User Completes Identity Verification
                        ↓
        Stripe Sends Webhook Notification
                        ↓
    Update kyc_status to 'verified' or 'rejected'
                        ↓
        User Can Now Request Withdrawal
```

### KYC Status States

| Status | Meaning | Action |
|--------|---------|--------|
| `unverified` | No KYC started | Redirect to KYC page |
| `pending` | KYC in progress | Show "Waiting for verification" |
| `verified` | KYC approved | Allow withdrawal |
| `rejected` | KYC failed | Show error, allow retry |

### Database Schema for KYC

```sql
CREATE TABLE user_payment_accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text DEFAULT 'stripe',  -- 'stripe' or 'paypal'
  provider_account_id text,         -- Stripe Connect account ID
  kyc_status text DEFAULT 'unverified',  -- unverified, pending, verified, rejected
  onboarding_url text,              -- Stripe Connect onboarding link
  paypal_email text,                -- PayPal email for PayPal withdrawals
  metadata jsonb,                   -- Additional KYC data
  created_at timestamptz,
  updated_at timestamptz
);
```

---

## Admin Review & Approval

### Step 1: Admin Views Pending Withdrawals

**Location**: Admin Dashboard → Withdrawals Panel

**API Endpoint**: `GET /api/admin/withdrawals`

**Response**:
```json
{
  "withdrawals": [
    {
      "id": "withdrawal-uuid",
      "user_id": "user-uuid",
      "amount": 50,
      "currency": "USD",
      "status": "pending",
      "provider": "stripe",
      "provider_account": "acct_xxxxx",
      "provider_kyc_status": "verified",
      "requested_at": "2025-10-25T10:00:00Z",
      "updated_at": "2025-10-25T10:00:00Z"
    }
  ]
}
```

**Admin Dashboard Display**:
- List of all pending withdrawals
- User information (name, email)
- Withdrawal amount
- Payment method
- KYC status
- Request date/time
- Action buttons: Approve / Reject

### Step 2: Admin Reviews Withdrawal Request

**Admin Checks**:
1. ✅ User identity verified (KYC status = 'verified')
2. ✅ Withdrawal amount is reasonable
3. ✅ User account is not flagged
4. ✅ No duplicate requests
5. ✅ Payment method is valid

### Step 3: Admin Approves Withdrawal

**API Endpoint**: `POST /api/admin/refunds/approve`

**Request Body**:
```json
{
  "refund_id": "withdrawal-uuid"
}
```

**Backend Process** (`app/api/admin/refunds/approve/route.ts`):

1. **Verify Admin Authorization**:
   ```typescript
   const { data: adminUser } = await supabase
     .from('users')
     .select('role')
     .eq('id', user.id)
     .single();
   
   if (adminUser?.role !== 'admin') {
     return error('Admin access required');
   }
   ```

2. **Verify KYC Status Again** (Double-check):
   ```typescript
   const { data: paymentAccount } = await supabase
     .from('user_payment_accounts')
     .select('*')
     .eq('user_id', refund.user_id)
     .maybeSingle();
   
   if (paymentAccount?.kyc_status !== 'verified') {
     return error('KYC verification required');
   }
   ```

3. **Update Withdrawal Status**:
   ```typescript
   await supabase
     .from('withdrawals')
     .update({
       status: 'approved',
       approved_by: admin_user_id,
       approved_at: now(),
       updated_at: now()
     })
     .eq('id', withdrawal_id);
   ```

4. **Create Audit Log**:
   ```typescript
   await supabase
     .from('audit_logs')
     .insert({
       action: 'withdrawal_approved',
       user_id: admin_user_id,
       details: {
         withdrawal_id,
         amount,
         user_id: refund.user_id,
         payment_provider: paymentAccount?.provider
       },
       created_at: now()
     });
   ```

5. **Notify User**:
   ```typescript
   await supabase
     .from('notifications')
     .insert({
       user_id: refund.user_id,
       type: 'withdrawal_approved',
       title: 'Withdrawal Approved',
       message: `Your withdrawal request for $${amount} has been approved and is being processed.`,
       created_at: now()
     });
   ```

6. **Trigger Payment Processing**:
   ```typescript
   // Call /api/admin/refunds/process endpoint
   const processResponse = await fetch('/api/admin/refunds/process', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: JSON.stringify({ refund_id: withdrawal_id })
   });
   ```

### Step 4: Admin Rejects Withdrawal (Alternative)

**API Endpoint**: `POST /api/admin/refunds/reject`

**Request Body**:
```json
{
  "refund_id": "withdrawal-uuid",
  "reason": "Suspicious activity detected"
}
```

**Backend Process** (`app/api/admin/refunds/reject/route.ts`):

1. **Update Withdrawal Status**:
   ```typescript
   await supabase
     .from('withdrawals')
     .update({
       status: 'rejected',
       rejection_reason: reason,
       updated_at: now()
     })
     .eq('id', withdrawal_id);
   ```

2. **Restore Winnings Credits**:
   ```typescript
   const { data: credits } = await supabase
     .from('user_credits')
     .select('winnings_credits')
     .eq('user_id', refund.user_id)
     .single();
   
   await supabase
     .from('user_credits')
     .update({
       winnings_credits: credits.winnings_credits + refund.amount
     })
     .eq('user_id', refund.user_id);
   ```

3. **Create Audit Log**:
   ```typescript
   await supabase
     .from('audit_logs')
     .insert({
       action: 'withdrawal_rejected',
       user_id: admin_user_id,
       details: {
         withdrawal_id,
         amount: refund.amount,
         user_id: refund.user_id,
         rejection_reason: reason
       },
       created_at: now()
     });
   ```

4. **Notify User**:
   ```typescript
   await supabase
     .from('notifications')
     .insert({
       user_id: refund.user_id,
       type: 'withdrawal_rejected',
       title: 'Withdrawal Request Rejected',
       message: `Your withdrawal request for $${amount} has been rejected. Reason: ${reason}`,
       created_at: now()
     });
   ```

5. **Credits Restored**:
   - User's winnings credits are restored
   - User can request withdrawal again

---

## Payment Processing

### Step 1: Initiate Payment with Provider

**API Endpoint**: `POST /api/admin/refunds/process`

**Process**:
1. Get withdrawal details
2. Get user's payment account information
3. Based on provider (Stripe or PayPal), initiate payout:

#### For Stripe:
```typescript
// Create Stripe payout
const payout = await stripe.payouts.create({
  amount: withdrawal.amount * 100,  // Convert to cents
  currency: 'usd',
  destination: paymentAccount.provider_account_id,
  statement_descriptor: 'Kick Expert Withdrawal'
});

// Store payout reference
await supabase
  .from('provider_payouts')
  .insert({
    withdrawal_id,
    provider: 'stripe',
    provider_payout_id: payout.id,
    amount: withdrawal.amount,
    currency: 'USD',
    status: 'initiated',
    response: payout
  });
```

#### For PayPal:
```typescript
// Create PayPal payout
const payout = await paypal.payouts.create({
  sender_batch_header: {
    sender_batch_id: `withdrawal-${withdrawal_id}`,
    email_subject: 'You have a payout from Kick Expert'
  },
  items: [{
    recipient_type: 'EMAIL',
    amount: {
      value: withdrawal.amount.toString(),
      currency: 'USD'
    },
    receiver: paymentAccount.paypal_email,
    note: 'Kick Expert Withdrawal'
  }]
});

// Store payout reference
await supabase
  .from('provider_payouts')
  .insert({
    withdrawal_id,
    provider: 'paypal',
    provider_payout_id: payout.batch_header.payout_batch_id,
    amount: withdrawal.amount,
    currency: 'USD',
    status: 'initiated',
    response: payout
  });
```

### Step 2: Monitor Payment Status

**Webhook Handlers**:
- Stripe: `POST /api/stripe-webhook`
- PayPal: `POST /api/paypal-webhook`

**Status Updates**:
```
initiated → processing → completed
         ↓
      failed → manual_review
```

**Database Update**:
```typescript
await supabase
  .from('provider_payouts')
  .update({
    status: 'completed',
    updated_at: now()
  })
  .eq('provider_payout_id', payout_id);

// Update withdrawal status
await supabase
  .from('withdrawals')
  .update({
    status: 'completed',
    completed_at: now(),
    updated_at: now()
  })
  .eq('id', withdrawal_id);
```

### Step 3: Final Notification

**User Receives**:
- Email notification: "Your withdrawal has been processed"
- In-app notification with payout details
- Transaction reference number

---

## Database Schema

### withdrawals Table
```sql
CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',  -- pending, approved, processing, completed, failed, rejected
  provider text,  -- 'stripe' or 'paypal'
  provider_account text,  -- Stripe account ID or PayPal email
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  completed_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected')),
  CONSTRAINT valid_provider CHECK (provider IN ('stripe', 'paypal'))
);
```

### user_payment_accounts Table
```sql
CREATE TABLE user_payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text DEFAULT 'stripe',
  provider_account_id text,  -- Stripe Connect account ID
  kyc_status text DEFAULT 'unverified',  -- unverified, pending, verified, rejected
  onboarding_url text,  -- Stripe Connect onboarding link
  paypal_email text,  -- PayPal email
  metadata jsonb,  -- Additional KYC data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_kyc_status CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  CONSTRAINT valid_provider CHECK (provider IN ('stripe', 'paypal'))
);
```

### provider_payouts Table
```sql
CREATE TABLE provider_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
  provider text NOT NULL,  -- 'stripe' or 'paypal'
  provider_payout_id text,  -- Payout ID from provider
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'initiated',  -- initiated, processing, completed, failed
  response jsonb,  -- Full response from provider
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('initiated', 'processing', 'completed', 'failed'))
);
```

### withdrawal_audit_logs Table
```sql
CREATE TABLE withdrawal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,  -- requested, approved, rejected, processing, completed, failed
  note text,
  data jsonb,  -- Additional context
  created_at timestamptz DEFAULT now()
);
```

---

## API Endpoints

### User Endpoints

#### 1. Request Withdrawal
```
POST /api/withdrawals
Authorization: Bearer <token>

Request:
{
  "amount": 50,
  "method": "stripe",  // or "paypal"
  "paypal_email": "user@example.com"  // Optional, required for PayPal
}

Response (Success):
{
  "ok": true,
  "withdrawal_id": "uuid-here"
}

Response (KYC Required):
{
  "error": "KYC verification required",
  "kyc_status": "unverified",
  "requires_onboarding": true
}

Response (Insufficient Credits):
{
  "error": "Insufficient winnings credits",
  "available": 25,
  "requested": 50
}
```

#### 2. Get User's Withdrawals
```
GET /api/withdrawals
Authorization: Bearer <token>

Response:
{
  "withdrawals": [
    {
      "id": "uuid",
      "amount": 50,
      "currency": "USD",
      "status": "completed",
      "provider": "stripe",
      "requested_at": "2025-10-25T10:00:00Z",
      "completed_at": "2025-10-25T10:30:00Z"
    }
  ]
}
```

### Admin Endpoints

#### 1. List Pending Withdrawals
```
GET /api/admin/withdrawals
Authorization: Bearer <admin_token>

Response:
{
  "withdrawals": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "amount": 50,
      "status": "pending",
      "provider": "stripe",
      "provider_kyc_status": "verified",
      "requested_at": "2025-10-25T10:00:00Z"
    }
  ]
}
```

#### 2. Approve Withdrawal
```
POST /api/admin/withdrawals/[id]/approve
Authorization: Bearer <admin_token>

Request:
{
  "withdrawal_id": "uuid"
}

Response:
{
  "success": true,
  "withdrawal": {
    "id": "uuid",
    "status": "approved",
    "approved_at": "2025-10-25T10:15:00Z"
  }
}
```

#### 3. Reject Withdrawal
```
POST /api/admin/withdrawals/[id]/reject
Authorization: Bearer <admin_token>

Request:
{
  "withdrawal_id": "uuid",
  "reason": "Suspicious activity"
}

Response:
{
  "success": true,
  "withdrawal": {
    "id": "uuid",
    "status": "rejected",
    "rejection_reason": "Suspicious activity"
  }
}
```

#### 4. Process Payment
```
POST /api/admin/refunds/process
Authorization: Bearer <admin_token>

Request:
{
  "refund_id": "uuid"
}

Response:
{
  "ok": true,
  "payout_id": "payout-uuid",
  "status": "processing"
}
```

---

## Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `KYC verification required` | 403 | User not KYC verified | Redirect to KYC page |
| `Insufficient winnings credits` | 400 | Not enough balance | Show available balance |
| `Invalid amount` | 400 | Amount < $20 or invalid | Show minimum amount |
| `Unauthorized` | 401 | Invalid/expired token | Re-authenticate |
| `Admin access required` | 403 | User is not admin | Deny access |
| `Withdrawal not found` | 404 | Invalid withdrawal ID | Check withdrawal ID |
| `Payment processing failed` | 500 | Provider error | Retry or manual review |

### Retry Logic

```typescript
// Exponential backoff for failed payments
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const result = await processPayment(withdrawal);
    return result;
  } catch (error) {
    retryCount++;
    if (retryCount >= maxRetries) {
      // Mark for manual review
      await supabase
        .from('withdrawals')
        .update({ status: 'manual_review' })
        .eq('id', withdrawal_id);
      throw error;
    }
    // Wait before retry (exponential backoff)
    await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
  }
}
```

---

## Security & Compliance

### 1. KYC/AML Compliance
- ✅ All withdrawals require KYC verification
- ✅ KYC status verified at multiple checkpoints
- ✅ Audit logs track all KYC changes
- ✅ Failed KYC attempts logged

### 2. Data Protection
- ✅ All sensitive data encrypted in transit (HTTPS)
- ✅ PII stored securely in Supabase
- ✅ Payment information never stored locally
- ✅ Stripe/PayPal handles PCI compliance

### 3. Transaction Safety
- ✅ Atomic transactions (all-or-nothing)
- ✅ Row-level locking prevents race conditions
- ✅ Automatic rollback on failure
- ✅ Idempotent operations (safe to retry)

### 4. Audit Trail
- ✅ All actions logged in `audit_logs`
- ✅ Admin actions tracked with user ID
- ✅ Timestamps on all records
- ✅ Withdrawal history immutable

### 5. Fraud Prevention
- ✅ Duplicate request detection
- ✅ Unusual amount flagging
- ✅ Rate limiting on withdrawal requests
- ✅ Admin review for high-value withdrawals

### 6. User Privacy
- ✅ Users can only see their own withdrawals
- ✅ Admin can only see withdrawal metadata
- ✅ Payment details not exposed to admin
- ✅ GDPR-compliant data handling

---

## Complete Withdrawal Timeline

```
Day 1 - User Requests Withdrawal
├─ 10:00 AM: User clicks "Request Withdrawal"
├─ 10:01 AM: KYC status checked
├─ 10:02 AM: Withdrawal request submitted
├─ 10:03 AM: Credits deducted from account
├─ 10:04 AM: Withdrawal record created (status: pending)
└─ 10:05 AM: User receives confirmation notification

Day 1 - Admin Reviews
├─ 2:00 PM: Admin views pending withdrawals
├─ 2:05 PM: Admin reviews user details and KYC status
├─ 2:10 PM: Admin approves withdrawal
├─ 2:11 PM: Withdrawal status updated to 'approved'
├─ 2:12 PM: Payment processing initiated
└─ 2:13 PM: User receives approval notification

Day 1-2 - Payment Processing
├─ 2:15 PM: Payout sent to Stripe/PayPal
├─ 2:30 PM: Payment provider processes request
├─ Next Day: Payment completes
├─ Next Day: Webhook received confirming completion
├─ Next Day: Withdrawal status updated to 'completed'
└─ Next Day: User receives completion notification

Final State:
├─ Withdrawal status: 'completed'
├─ User receives funds in bank/PayPal account
├─ Audit log shows complete history
└─ Credits permanently deducted
```

---

## Troubleshooting

### User Cannot Request Withdrawal
**Check**:
1. Does user have winnings credits? (Check `user_credits.winnings_credits`)
2. Is KYC verified? (Check `user_payment_accounts.kyc_status`)
3. Is amount ≥ $20?
4. Is user authenticated?

### Withdrawal Stuck in "Pending"
**Check**:
1. Has admin approved it?
2. Is payment processing running?
3. Check `provider_payouts` table for errors
4. Check server logs for processing errors

### Payment Failed
**Check**:
1. Is Stripe/PayPal account valid?
2. Is provider account ID correct?
3. Check payment provider dashboard
4. Retry payment or mark for manual review

### KYC Verification Failing
**Check**:
1. Is Stripe Connect configured?
2. Is onboarding URL valid?
3. Check Stripe Connect dashboard
4. Verify user's identity documents

---

## Summary

The complete withdrawal process ensures:
- ✅ **Security**: KYC verification, audit trails, encrypted data
- ✅ **Compliance**: AML/KYC requirements, GDPR compliance
- ✅ **Reliability**: Atomic transactions, error handling, retries
- ✅ **Transparency**: User notifications, admin oversight, audit logs
- ✅ **Efficiency**: Automated processing, webhook handling, status tracking

Users can confidently request withdrawals knowing their funds are secure and their identity is verified.
