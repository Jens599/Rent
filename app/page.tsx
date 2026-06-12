import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRightIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  HistoryIcon,
  Layers3Icon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

const quickActions = [
  {
    title: "Create invoice",
    description: "Generate a rent bill with meter readings and totals.",
    href: "/invoice",
    label: "Start billing",
    icon: FileTextIcon,
    primary: true,
  },
  {
    title: "Manage tenants",
    description: "Keep rent, contact, and room details in one place.",
    href: "/tenants",
    label: "View tenants",
    icon: UsersIcon,
  },
  {
    title: "Review history",
    description: "Search previous invoices and pick up meter readings.",
    href: "/invoices",
    label: "Open history",
    icon: HistoryIcon,
  },
];

const highlights = [
  {
    title: "Tenant records",
    description: "Store base rent and reusable tenant details before billing.",
    icon: UsersIcon,
  },
  {
    title: "Meter math",
    description: "Calculate electricity usage from current and previous readings.",
    icon: ZapIcon,
  },
  {
    title: "Flexible modules",
    description: "Tune calculation logic as your billing rules evolve.",
    icon: Layers3Icon,
  },
  {
    title: "Printable invoices",
    description: "Produce clean invoices that are ready to print or share.",
    icon: FileTextIcon,
  },
];

const workflow = [
  "Add tenants with rent and contact details",
  "Set electricity rates and calculation modules",
  "Generate invoices and keep monthly history",
];

export default function Page() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      <div className="absolute left-1/2 top-0 z-0 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-48 z-0 size-72 rounded-full bg-muted blur-3xl" />

      <section className="container relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <Badge variant="outline" className="mb-5 w-fit bg-background/70">
            <SparklesIcon className="size-3" /> Rent billing workspace
          </Badge>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Faster rent invoices with fewer manual calculations.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Manage tenants, carry meter readings forward, calculate electricity
            charges, and keep invoice history in one focused dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group h-11 px-5 text-sm">
              <Link href="/invoice">
                Create invoice
                <ArrowRightIcon className="size-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 bg-background/70 px-5 text-sm"
            >
              <Link href="/tenants">Manage tenants</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="border bg-background/70 p-4 backdrop-blur">
              <p className="text-2xl font-semibold">3 steps</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tenant, reading, invoice
              </p>
            </div>
            <div className="border bg-background/70 p-4 backdrop-blur">
              <p className="text-2xl font-semibold">Auto</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Previous meter carry-over
              </p>
            </div>
            <div className="border bg-background/70 p-4 backdrop-blur">
              <p className="text-2xl font-semibold">PWA</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Installable app experience
              </p>
            </div>
          </div>
        </div>

        <Card className="relative border-primary/20 bg-background/85 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardDescription>Current workflow</CardDescription>
                <CardTitle className="mt-1 text-2xl">Monthly billing</CardTitle>
              </div>
              <div className="border bg-primary p-3 text-primary-foreground">
                <CalculatorIcon className="size-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Base rent</p>
                <p className="mt-2 text-3xl font-semibold">Saved</p>
              </div>
              <div className="border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Electricity</p>
                <p className="mt-2 text-3xl font-semibold">Calculated</p>
              </div>
            </div>

            <div className="space-y-3">
              {workflow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 border bg-background p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 border border-primary/20 bg-primary/5 p-4">
              <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Invoice history feeds future readings so each new bill starts
                with better defaults.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container relative z-10 mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Card
                key={action.title}
                className={
                  action.primary
                    ? "border-primary/40 bg-primary text-primary-foreground"
                    : "bg-background/80 backdrop-blur"
                }
              >
                <CardHeader>
                  <div className="mb-4 flex size-11 items-center justify-center border bg-background/15">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{action.title}</CardTitle>
                  <CardDescription
                    className={
                      action.primary ? "text-primary-foreground/75" : undefined
                    }
                  >
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant={action.primary ? "secondary" : "outline"}
                    className="w-full justify-between"
                  >
                    <Link href={action.href}>
                      {action.label}
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Built for routine billing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Everything that should not be a spreadsheet.
            </h2>
          </div>
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/settings">
              Configure settings
              <SettingsIcon className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="bg-background/75">
                <CardHeader>
                  <div className="mb-4 flex size-10 items-center justify-center bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 bg-foreground text-background">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-background/70">
                <ClockIcon className="size-4" />
                Optimized for repeat monthly work
              </div>
              <h3 className="text-2xl font-semibold">
                Keep the flow simple: update readings, confirm totals, share the
                invoice.
              </h3>
            </div>
            <Button asChild variant="secondary" size="lg" className="md:w-44">
              <Link href="/invoices">View history</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
