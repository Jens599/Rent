# Rent Invoice Generator

A professional rent invoice management system built with Next.js that automates electricity billing calculations and streamlines tenant management.

## Features

- **Tenant Management**: Add, edit, and organize tenant information with base rent settings
- **Smart Calculations**: Automatic electricity cost calculations based on meter readings
- **Professional Invoices**: Generate clean, printable invoices with itemized billing
- **Meter Tracking**: Automatic carry-over of previous month readings from last invoice
- **Real-time Preview**: See calculations update as you type
- **Invoice History**: Browse and search through all generated invoices
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **UI**: React 19.2.3, Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns, react-day-picker
- **Styling**: CSS-in-JS with Tailwind CSS v4
- **TypeScript**: Full type safety throughout the application

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
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Data Models

The application uses three main data types:

- **Tenant**: Stores tenant information including name, base rent, and contact details
- **Invoice**: Contains billing data with meter readings, calculations, and totals
- **Settings**: Global application settings like electricity rates

## Development

This project uses ESLint for code linting and TypeScript for type safety. The UI is built with modern React patterns and responsive design principles.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - beautifully designed components
- [Lucide Icons](https://lucide.dev/) - consistent icon library

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
