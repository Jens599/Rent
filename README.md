# Rent Invoice Generator

A professional rent invoice management system built with Next.js that automates electricity billing calculations and streamlines tenant management. Features Progressive Web App (PWA) capabilities for offline functionality and installability.

## Features

- **Tenant Management**: Add, edit, and organize tenant information with base rent settings
- **Smart Calculations**: Automatic electricity cost calculations based on meter readings
- **Professional Invoices**: Generate clean, printable invoices with itemized billing
- **Meter Tracking**: Automatic carry-over of previous month readings from last invoice
- **Real-time Preview**: See calculations update as you type
- **Invoice History**: Browse and search through all generated invoices
- **PWA Support**: Install as a desktop/mobile app with offline functionality
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components
- **Backend Integration**: Convex database for real-time data synchronization

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Frontend**: React 19.2.3, TypeScript 5
- **UI**: Tailwind CSS v4, shadcn/ui components
- **Icons**: Lucide React
- **Backend**: Convex for real-time database and functions
- **Authentication**: NextAuth.js
- **Date Handling**: date-fns, react-day-picker
- **PWA**: Serwist for service worker and caching
- **Development**: ESLint, PostCSS, esbuild

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

For Convex backend development:

```bash
npm run convex:dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

1. **Add Tenants**: Navigate to Tenant Management to add tenants with their base rent
2. **Configure Settings**: Set your electricity rate in the Settings section
3. **Generate Invoices**: Select a tenant, enter current meter reading, and let the system calculate:
   - Units consumed (current - previous reading)
   - Electricity cost (units × rate)
   - Total amount (base rent + electricity)
4. **Share Invoices**: Print or screenshot the professional invoice for your tenants

## Project Structure

```text
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes for data management
│   ├── invoice/           # Invoice generation page
│   ├── invoices/          # Invoice history page
│   ├── settings/          # Application settings
│   ├── tenants/           # Tenant management page
│   └── page.tsx           # Dashboard/homepage
├── components/
│   └── ui/                # shadcn/ui components
├── convex/                # Convex backend functions and schema
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── public/                # Static assets and PWA icons
├── pwa_implementation_guide.md  # PWA setup documentation
└── serwist_pwa_setup.md   # Serwist PWA configuration guide
```

## Data Models

The application uses three main data types:

- **Tenant**: Stores tenant information including name, base rent, and contact details
- **Invoice**: Contains billing data with meter readings, calculations, and totals
- **Settings**: Global application settings like electricity rates

## PWA Features

This application includes Progressive Web App capabilities:

- **Offline Support**: Core functionality works without internet connection
- **Installable**: Can be installed as a native app on desktop and mobile devices
- **Background Sync**: Automatic data synchronization when connection is restored
- **Caching**: Intelligent caching strategy for improved performance

## Development

This project uses:

- **ESLint** for code linting and consistency
- **TypeScript** for type safety throughout the application
- **Convex** for backend-as-a-service with real-time database
- **Serwist** for PWA functionality and service worker management
- Modern React patterns and responsive design principles

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run convex:dev` - Start Convex development backend

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Convex Documentation](https://docs.convex.dev/) - backend-as-a-service platform
- [Serwist Documentation](https://serwist.pages.dev/) - PWA framework for Next.js
- [Tailwind CSS](https://tailwindcss.com/docs) - utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - beautifully designed components
- [Lucide Icons](https://lucide.dev/) - consistent icon library
- [NextAuth.js](https://next-auth.js.org/) - authentication for Next.js

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
