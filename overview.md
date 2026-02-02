# Rent Invoice Generator - AI Context Overview

## Project Summary
A professional rent invoice management system built with Next.js that automates electricity billing calculations and streamlines tenant management for landlords/property managers.

## Tech Stack
- **Framework**: Next.js 16.1.1 with App Router
- **Frontend**: React 19.2.3, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS v4, Lucide React icons
- **Backend**: Convex (real-time database with built-in API)
- **Authentication**: NextAuth.js with bcryptjs
- **Date Handling**: date-fns, react-day-picker
- **Package Manager**: Bun (bun.lock present)

## Core Features
- **Tenant Management**: Add/edit tenants with base rent settings
- **Smart Electricity Billing**: Auto-calculate units consumed and costs
- **Professional Invoices**: Clean, printable invoices with itemized billing
- **Meter Reading Tracking**: Automatic carry-over from previous invoices
- **Real-time Calculations**: Live preview as users type
- **Invoice History**: Browse and search all generated invoices

## Database Schema (Convex)
```typescript
users: {
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

tenants: {
  userId: id("users")
  name: string
  baseRent: number
  contact?: string
  createdAt: string
}

invoices: {
  userId: id("users")
  tenantId: id("tenants")
  tenantName: string
  date: string
  baseRent: number
  previousMonthReading: number
  currentMonthReading: number
  unitsConsumed: number
  electricityRate?: number
  electricityCost: number
  total: number
}

settings: {
  electricityRate: number
  userId: id("users")
}
```

## Key Pages & Components
- **Dashboard** (`/`): Main landing with quick stats and navigation
- **Tenant Management** (`/tenants`): CRUD operations for tenants
- **Invoice Generator** (`/invoice`): Create new invoices with calculations
- **Invoice History** (`/invoices`): Browse and search past invoices
- **Authentication**: Sign-in/sign-up flows with NextAuth

## UI Architecture
- **Components**: Custom components in `/components` directory
- **UI Library**: shadcn/ui components in `/components/ui`
- **Styling**: Tailwind CSS with custom animations (tw-animate-css)
- **Icons**: Lucide React for consistent iconography
- **Design System**: Modern, responsive with hover states and transitions

## Business Logic
- **Electricity Calculation**: `(currentReading - previousReading) × electricityRate`
- **Total Invoice**: `baseRent + electricityCost`
- **Auto-population**: Previous month reading from last invoice per tenant
- **Settings**: Global electricity rate configurable per user

## Development Setup
```bash
bun install
bun run dev          # Next.js dev server
bun run convex:dev    # Convex backend server
```

## File Structure Highlights
- `/app` - Next.js App Router pages and API routes
- `/components` - React components and UI library
- `/convex` - Database schema and backend functions
- `/lib` - Utilities, types, and configuration
- `/public` - Static assets

## Key Dependencies
- **convex**: Real-time database and backend
- **next-auth**: Authentication solution
- **shadcn/ui**: Component library
- **date-fns**: Date manipulation
- **bcryptjs**: Password hashing
- **sonner**: Toast notifications

## Authentication Flow
- Uses NextAuth.js with custom credentials provider
- Password hashing with bcryptjs
- Session management for multi-tenant support
- User-specific data isolation via userId relationships

## Data Relationships
- Users → Tenants (one-to-many)
- Users → Invoices (one-to-many)
- Users → Settings (one-to-one)
- Tenants → Invoices (one-to-many)

This is a production-ready SaaS application for property management with a focus on automated rent invoicing and electricity billing calculations.
