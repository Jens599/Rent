# Environment Variables

Create a local `.env.local` file with the keys below. Production deployments need the same keys configured in the hosting provider environment settings.

## Development

Use these values for local development. Replace the Convex URL with the URL printed by `bun run convex:dev` or shown in your Convex dashboard.

```env
# Required: Convex deployment URL used by browser/client code and API routes.
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud

# Recommended: Server-side Convex URL fallback used by auth code.
CONVEX_URL=https://your-dev-deployment.convex.cloud

# Required: Secret used by NextAuth to sign and verify JWT/session tokens.
NEXTAUTH_SECRET=local-development-secret-change-me

# Required for clean NextAuth callback/session URLs in development.
NEXTAUTH_URL=http://localhost:3000
```

## Production

Use production Convex deployment values and a strong random `NEXTAUTH_SECRET`. Do not reuse the development secret.

```env
# Required: Public Convex production deployment URL.
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Recommended: Server-side Convex production deployment URL.
CONVEX_URL=https://your-prod-deployment.convex.cloud

# Required: Long random production secret for NextAuth JWT/session signing.
NEXTAUTH_SECRET=replace-with-a-long-random-production-secret

# Required: Canonical production app URL.
NEXTAUTH_URL=https://your-production-domain.com
```

## Variable Reference

| Key | Required | Used By | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Client pages and API routes | Must point to the active Convex deployment. Because it starts with `NEXT_PUBLIC_`, it is exposed to browser code. |
| `CONVEX_URL` | Recommended | `lib/auth.ts` server-side auth code | Can usually match `NEXT_PUBLIC_CONVEX_URL`. Kept separate so server-only Convex configuration can be changed later. |
| `NEXTAUTH_SECRET` | Yes | NextAuth and route protection | Must be stable across restarts. Use a unique strong value in production. |
| `NEXTAUTH_URL` | Yes | NextAuth callbacks/session handling | Use `http://localhost:3000` locally and your public app URL in production. |

## Convex Development Workflow

When Convex schema or functions change, run Convex development in a second terminal so the backend deployment receives the latest functions.

```bash
bun run convex:dev
```

Keep this running alongside the Next.js dev server:

```bash
bun dev
```

If you see an error like `Could not find public function for 'tasks:getCalculationModules'`, the Next.js app is running newer code than the Convex deployment. Start or restart `bun run convex:dev` and wait for Convex to finish syncing functions.

## Generate A Secret

With Bun:

```bash
bun -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

Or with OpenSSL:

```bash
openssl rand -base64 32
```

## Notes

- `NEXT_PUBLIC_CONVEX_URL` is required for Convex API access throughout the app.
- `CONVEX_URL` is optional but recommended because `lib/auth.ts` checks it before falling back to `NEXT_PUBLIC_CONVEX_URL`.
- `NEXTAUTH_SECRET` is required for stable authentication sessions, especially in production.
