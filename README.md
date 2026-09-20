# TanStack Start + shadcn/ui

## Stalwart mail server

The app starts in mock mode. For a Stalwart 0.16+ server, configure `JMAP_MODE=real`, `JMAP_STALWART_ORIGIN=https://mail.example.com`, `STALWART_OAUTH_CLIENT_ID=workspace-tool`, `SESSION_SECRET` (a long random value), and `DATABASE_URL`. Register the OAuth client ID in Stalwart with authorization-code and refresh-token grants. The app uses Stalwart's `/api/auth`, `/auth/token`, and `/.well-known/jmap` endpoints; mail data remains in Stalwart. Run `pnpm db:migrate` before starting the app to create the app-owned settings and template tables.

Use a test account first. In **Settings → Account**, check JMAP reachability, account binding, capabilities, and permissions. The Vacation responder and Filters sections only become editable when the account advertises the relevant JMAP extension and has permission to use it. The app never activates its managed filter script while an unrelated Sieve script is active.

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

### Calendar feeds

Read-only iCal subscriptions require `DATABASE_URL`, migration `003_calendar_feeds.sql`, and `CALENDAR_FEED_ENCRYPTION_KEY` (a stable, private 32+ character secret shared by web and worker processes). The feed URL is encrypted in PostgreSQL; cached events are stored per user/account. Schedule `pnpm exec tsx scripts/refresh-calendar-feeds.ts` hourly on a trusted worker with those same environment variables. The worker refreshes due feeds, honors ETag/Last-Modified, and retains the last successful snapshot when a fetch fails. No Stalwart credentials are sent to feed URLs. The scheduled worker must be deployed separately when the web host has no hourly job support.

### Scheduled mail

Undo send (10 seconds), scheduled send, Outbox, and snooze require a real Stalwart account with refresh tokens, `DATABASE_URL`, migration `004_mail_jobs.sql`, and a stable private `MAIL_JOB_ENCRYPTION_KEY` of at least 32 characters on the web and worker processes. Run `pnpm db:migrate`, then invoke `pnpm exec tsx scripts/process-mail-jobs.ts` every minute from a trusted scheduler. Payloads and credentials are encrypted in PostgreSQL; the worker contacts only the configured Stalwart origin. An interrupted submission is marked for review instead of automatically resent. Keep the encryption key stable or existing jobs cannot be processed. Mock mode and deployments without these requirements retain immediate send and show scheduling as unavailable.
