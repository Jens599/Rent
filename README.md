# Rent Invoice Generator

Rent Invoice Generator is a Next.js app for managing tenants, generating rent invoices, calculating electricity charges, and keeping billing history. It uses Convex for the backend, NextAuth for authentication, and Serwist for Progressive Web App support.

## Features

- Tenant management with base rent and contact details
- Invoice generation with current and previous meter readings
- Automatic electricity and total amount calculations
- Invoice history for tracking past bills and reusing readings
- Configurable calculation modules and app settings
- Credentials-based authentication with protected app routes
- Installable PWA experience with service worker support
- Responsive UI built with Tailwind CSS and shadcn-style components

## Tech Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS v4
- Convex database and server functions
- NextAuth.js authentication
- Serwist PWA tooling
- Lucide React icons

## Requirements

- Node.js or Bun
- A Convex deployment URL
- Environment variables in `.env.local`

See `env-example.md` for the full environment variable reference.

## Getting Started

Install dependencies:

```bash
npm install
```

Or with Bun:

```bash
bun install
```

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
CONVEX_URL=https://your-dev-deployment.convex.cloud
NEXTAUTH_SECRET=local-development-secret-change-me
NEXTAUTH_URL=http://localhost:3000
```

Start Convex in one terminal:

```bash
npm run convex:dev
```

Start the app in another terminal:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` starts the Next.js development server
- `npm run build` creates a production build
- `npm run start` starts the production server
- `npm run lint` runs ESLint
- `npm run convex:dev` starts Convex development sync

The same scripts can be run with Bun, for example `bun run dev` and `bun run convex:dev`.

## Project Structure

```text
app/                         Next.js App Router pages and API routes
app/api/                     API routes for auth, tenants, invoices, settings, and modules
app/auth/                    Sign in and sign up pages
app/invoice/                 Invoice generation page
app/invoices/                Invoice history page
app/modules/                 Calculation module management
app/settings/                App settings page
app/tenants/                 Tenant management page
components/                  Shared React components
components/ui/               UI primitives
convex/                      Convex schema, functions, and generated API
lib/                         Auth, utilities, logging, types, and calculations
public/                      Static assets and PWA files
```

## Billing Flow

1. Add tenants with rent and contact information.
2. Configure electricity rates and calculation modules.
3. Generate an invoice by selecting a tenant and entering the current meter reading.
4. Review calculated rent, electricity usage, and total amount.
5. Print or share the invoice and keep it in history for future readings.

## Verification

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

If Convex functions or schema changed, also run `npm run convex:dev` and confirm the backend sync completes.
