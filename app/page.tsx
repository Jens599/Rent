import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UsersIcon,
  FileTextIcon,
  TrendingUpIcon,
  ZapIcon,
  CalculatorIcon,
  ClockIcon,
} from "lucide-react";

export default function Page() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Rent Invoice Generator</h1>
        <p className="text-muted-foreground text-lg">
          Professional invoice management system with automatic electricity
          calculations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <UsersIcon className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Tenant Management</h3>
            <p className="text-sm text-muted-foreground">
              Organize all your tenants
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <CalculatorIcon className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Auto Calculations</h3>
            <p className="text-sm text-muted-foreground">
              Smart electricity billing
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <ZapIcon className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Meter Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Automatic reading carry-over
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <FileTextIcon className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Professional Invoices</h3>
            <p className="text-sm text-muted-foreground">
              Clean, printable format
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-2 group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                <UsersIcon className="size-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Tenant Management</CardTitle>
                <CardDescription>
                  Add, edit, and manage your tenants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/tenants">
              <Button
                className="w-full transition-all duration-200 hover:scale-105"
                size="lg"
              >
                Manage Tenants
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                <FileTextIcon className="size-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Generate Invoice</CardTitle>
                <CardDescription>
                  Create new rent invoices instantly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/invoice">
              <Button
                className="w-full transition-all duration-200 hover:scale-105"
                size="lg"
              >
                Create Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                <TrendingUpIcon className="size-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">View History</CardTitle>
                <CardDescription>Browse all generated invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/invoices">
              <Button
                className="w-full transition-all duration-200 hover:scale-105"
                variant="outline"
                size="lg"
              >
                Invoice History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5" />
              Smart Calculations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Customizable electricity rate per unit
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Previous month reading auto-populated from last invoice
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Total amount calculated with base rent + electricity
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Real-time calculation preview as you type
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Time-Saving Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Current date/time automatically captured
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Base rent auto-filled from tenant settings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                One-click invoice generation and viewing
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Search and filter through invoice history
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-2xl">How It Works</CardTitle>
          <CardDescription>
            Get started in just a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Add Tenants</h3>
              <p className="text-sm text-muted-foreground">
                Enter tenant details and set their base rent in the Tenant
                Management section
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Generate Invoices</h3>
              <p className="text-sm text-muted-foreground">
                Select a tenant, enter current meter reading, and let the system
                handle calculations
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Share & Track</h3>
              <p className="text-sm text-muted-foreground">
                Print or screenshot the professional invoice and track payment
                history
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
