"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceDisplay } from "@/components/invoice-display";
import type { Tenant, Invoice } from "@/lib/types";
import {
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UserIcon,
  CurrencyIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [invoicesWithDates, setInvoicesWithDates] = React.useState<
    (Invoice & { dateObj: Date })[]
  >([]);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [filteredInvoices, setFilteredInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("date-desc");
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(
    null,
  );

  // Load data
  React.useEffect(() => {
    loadData();
  }, []);

  // Update invoices with cached dates when invoices change
  React.useEffect(() => {
    if (invoices.length > 0) {
      const withDates = invoices.map((invoice) => ({
        ...invoice,
        dateObj: new Date(invoice.date),
      }));
      setInvoicesWithDates(withDates);
    }
  }, [invoices]);

  // Filter and sort invoices
  React.useEffect(() => {
    let result = invoicesWithDates;

    // Filter by tenant
    if (selectedTenantId !== "all") {
      result = result.filter(
        (invoice) => invoice.tenantId === selectedTenantId,
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.tenantName.toLowerCase().includes(term) ||
          invoice.id.toLowerCase().includes(term) ||
          new Date(invoice.date).toLocaleDateString().includes(term),
      );
    }

    // Sort - create new array to avoid mutating original
    const sortedResult = [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.dateObj.getTime() - a.dateObj.getTime();
        case "date-asc":
          return a.dateObj.getTime() - b.dateObj.getTime();
        case "total-desc":
          return b.total - a.total;
        case "total-asc":
          return a.total - b.total;
        case "name-asc":
          return a.tenantName.localeCompare(b.tenantName);
        case "name-desc":
          return b.tenantName.localeCompare(a.tenantName);
        default:
          return 0;
      }
    });

    setFilteredInvoices(sortedResult);
  }, [invoicesWithDates, selectedTenantId, searchTerm, sortBy]);

  const loadData = async () => {
    try {
      const [invoicesResponse, tenantsResponse] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/tenants"),
      ]);

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      } else {
        toast.error("Failed to load invoices");
      }

      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json();
        setTenants(tenantsData);
      } else {
        toast.error("Failed to load tenants");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getTotalInvoices = () => filteredInvoices.length;
  const getTotalRevenue = () =>
    filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown Tenant";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileTextIcon />
          Invoice History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and search all generated invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
              <p className="text-2xl font-bold text-center">
                {getTotalInvoices()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <CurrencyIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-center">
                Rs.{" "}
                {getTotalRevenue().toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Tenants</p>
              </div>
              <p className="text-2xl font-bold text-center">{tenants.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="search">Search</FieldLabel>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by tenant, ID, or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="tenant">Tenant</FieldLabel>
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                >
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="All tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="sort">Sort By</FieldLabel>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">
                      Date (Newest First)
                    </SelectItem>
                    <SelectItem value="date-asc">
                      Date (Oldest First)
                    </SelectItem>
                    <SelectItem value="total-desc">
                      Amount (High to Low)
                    </SelectItem>
                    <SelectItem value="total-asc">
                      Amount (Low to High)
                    </SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({getTotalInvoices()})</CardTitle>
          <CardDescription>
            {selectedTenantId !== "all"
              ? `Showing invoices for ${getTenantName(selectedTenantId)}`
              : "Showing all invoices"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No invoices found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or generate some invoices first.
              </p>
              <Link href="/invoice">
                <Button className="mt-4">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {invoice.tenantName}
                          </h3>
                          <Badge variant="secondary">ID: {invoice.id}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(invoice.date).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>
                              Units: {invoice.unitsConsumed.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          Rs.{" "}
                          {invoice.total.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rent: Rs. {invoice.baseRent.toLocaleString()} +
                          Electricity: Rs.{" "}
                          {invoice.electricityCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="overflow-y-auto p-0 min-w-2/5">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {selectedInvoice && <InvoiceDisplay invoice={selectedInvoice} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
