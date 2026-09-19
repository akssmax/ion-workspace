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
