# Managed pilot website

The website describes a private pilot, not self-service hosted availability. `/` always displays marketing; `/app` remains the authenticated workspace. Demo entry and exit use full document navigation to separate runtime state.

## Pilot form delivery

Set server-only environment variables, then restart/redeploy:

- `PILOT_FORM_ENDPOINT`: HTTPS webhook accepting JSON POST. No URL credentials or redirects.
- `PILOT_FORM_TOKEN`: optional bearer token; never exposed to the client.

Payload: `requestId` (UUID), `submittedAt` (ISO timestamp), `source` (`website` or `enterprise`), `sourcePage`, `name`, `email`, `company`, `teamSize`, `requirements`. `Idempotency-Key` equals `requestId`. A 2xx response must mean the destination accepted delivery. Configure the destination to deduplicate on this key: a timeout may happen after it has accepted a request. No automatic marketing subscription.

Without a valid endpoint, the form visibly reports unavailable and cannot submit. Failures preserve entered values. Secrets and submitted personal information are not logged by the handler. Protection includes a honeypot, validation, a ten-second timeout, bounded process-local limits (3 attempts per email and 100 total per 15 minutes), and in-flight/delivered-request deduplication. Configure ingress rate limits for multi-instance production; process-local limits reset on restart.

Before public launch: connect and test the endpoint with synthetic data, establish destination retention/access rules, and confirm managed-pilot service claims with the operator. Billing, provisioning, and enterprise feature development are outside this site change.

## Demo

`/demo` is an unauthenticated sample workspace. Its browser runtime uses a fresh mock provider and query cache, synthetic session, nonpersistent UI settings, and local preferences, templates, and saved searches. It does not call real authentication, preference, template, saved-search, or JMAP endpoints. A global client function middleware blocks any accidental server-function call from the demo runtime. Refresh/reset restores seed data. Real account cookies and preferences are untouched.

## Live landing-page showcase

The landing page embeds the actual `/demo?embed=true` workspace in a separate browser document when its showcase approaches the viewport. This keeps the app, mock data, query cache, and shortcuts out of the marketing runtime. Desktop previews fit a 1120px workspace into the grid; phones use the app's native responsive layout. The outer tabs and iframe sidebar stay synchronized, and theme changes update the iframe without a reload. Both message listeners verify the sending window and origin; incoming configuration is restricted to the four app names and light/dark modes. The full-demo link opens the currently selected app. The sample-data notice stays outside the iframe, and a slow-load fallback links to the standalone demo.
