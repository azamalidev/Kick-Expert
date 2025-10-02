# Email System Tests

This directory contains tests for the email system to ensure correctness and production readiness.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Note: Tests may require additional Jest configuration for Next.js API routes. The test files are structured for unit and integration testing.

## Test Coverage

### Unit Tests
- `newsletter.test.ts`: Tests for subscribe and confirm API endpoints

### Integration Tests
- `webhook.test.ts`: Simulates SendGrid webhook events and verifies DB updates

### Smoke Tests
- `smoke.test.ts`: Tests transactional email sending

## Monitoring

Bounces and complaints are logged in the webhook handler (`pages/api/webhooks/sendgrid.ts`). Alerts are triggered if:
- Bounce rate > 2%
- Complaint rate > 0.1%

Monitor SendGrid dashboard and DB metrics for deliverability.