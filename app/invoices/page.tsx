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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InvoiceDisplay } from "@/components/invoice-display";
import type { Tenant, Invoice } from "@/lib/types";
import {
  ChevronDownIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UserIcon,
  CurrencyIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ImportMode = "merge" | "append" | "replace";

type ImportPreview = {
  totalCount: number;
  validCount: number;
  duplicateCount: number;
  skippedCount: number;
  mergeImportCount: number;
  appendImportCount: number;
  replaceImportCount: number;
  existingCount: number;
  newTenantCount: number;
  newTenantNames: string[];
  missingTenants: Array<{
    name: string;
    invoiceCount: number;
    mergeImportCount: number;
  }>;
  missingTenantInvoiceCount: number;
  missingTenantMergeImportCount: number;
  skipped: Array<{ index: number; reason: string }>;
};

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function InvoiceHistoryPage() {
  const { data: session, status } = useSession();
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
  const [importing, setImporting] = React.useState(false);
  const [importPreview, setImportPreview] = React.useState<ImportPreview | null>(
    null,
  );
  const [pendingImportInvoices, setPendingImportInvoices] = React.useState<
    unknown[]
  >([]);
  const [selectedMissingTenantNames, setSelectedMissingTenantNames] =
    React.useState<string[]>([]);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(
    null,
  );
  const [deletingInvoiceId, setDeletingInvoiceId] = React.useState<string | null>(
    null,
  );
  const importInputRef = React.useRef<HTMLInputElement>(null);

  // Load data
  React.useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      loadData();
      return;
    }
    setLoading(false);
  }, [status, session?.user?.id]);

  // Update invoices with cached dates when invoices change
  React.useEffect(() => {
    setInvoicesWithDates(
      invoices.map((invoice) => ({
        ...invoice,
        dateObj: new Date(invoice.date),
      })),
    );
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
          invoice._id.toLowerCase().includes(term) ||
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
    if (!session?.user?.id) {
      return;
    }

    try {
      const [invoicesResponse, tenantsResponse] = await Promise.all([
        fetch(`/api/invoices?userId=${session.user.id}`),
        fetch(`/api/tenants?userId=${session.user.id}`),
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
    const tenant = tenants.find((t) => t._id === tenantId);
    return tenant?.name || "Unknown Tenant";
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getExportPayload = (exportedInvoices: Invoice[]) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    invoiceCount: exportedInvoices.length,
    invoices: exportedInvoices,
  });

  const handleExportJson = (exportedInvoices: Invoice[], scope: string) => {
    const exportData = {
      ...getExportPayload(exportedInvoices),
      scope,
    };
    downloadFile(
      JSON.stringify(exportData, null, 2),
      `rent-invoice-history-${scope}-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
    toast.success(`Exported ${exportedInvoices.length} invoice(s) as JSON`);
  };

  const escapeCsvValue = (value: unknown) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const handleExportCsv = () => {
    const headers = [
      "Invoice ID",
      "Tenant",
      "Date",
      "Previous Reading",
      "Current Reading",
      "Units Consumed",
      "Electricity Rate",
      "Base Rent",
      "Electricity Cost",
      "Total",
    ];
    const rows = filteredInvoices.map((invoice) => [
      invoice._id,
      invoice.tenantName,
      invoice.date,
      invoice.previousMonthReading,
      invoice.currentMonthReading,
      invoice.unitsConsumed,
      invoice.electricityRate ?? "",
      invoice.baseRent,
      invoice.electricityCost,
      invoice.total,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    downloadFile(
      csv,
      `rent-invoice-history-filtered-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
    );
    toast.success(`Exported ${filteredInvoices.length} invoice(s) as CSV`);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setDeletingInvoiceId(invoice._id);

    try {
      const params = new URLSearchParams({
        id: invoice._id,
        userId: session.user.id,
      });
      const response = await fetch(`/api/invoices?${params.toString()}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to delete invoice");
        return;
      }

      setInvoices((current) =>
        current.filter((currentInvoice) => currentInvoice._id !== invoice._id),
      );
      setSelectedInvoice((current) =>
        current?._id === invoice._id ? null : current,
      );
      toast.success(`Deleted invoice for ${invoice.tenantName}`);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === "," && !quoted) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  };

  const parseInvoiceCsv = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
    const getValue = (row: string[], label: string) =>
      row[headers.indexOf(label.toLowerCase())];
    const getNumberValue = (row: string[], label: string) => {
      const value = Number(getValue(row, label));
      return Number.isFinite(value) ? value : 0;
    };

    return lines.slice(1).map((line) => {
      const row = parseCsvLine(line);
      return {
        _id: getValue(row, "Invoice ID"),
        tenantName: getValue(row, "Tenant"),
        date: getValue(row, "Date"),
        previousMonthReading: getNumberValue(row, "Previous Reading"),
        currentMonthReading: getNumberValue(row, "Current Reading"),
        unitsConsumed: getNumberValue(row, "Units Consumed"),
        electricityRate: getNumberValue(row, "Electricity Rate"),
        baseRent: getNumberValue(row, "Base Rent"),
        electricityCost: getNumberValue(row, "Electricity Cost"),
        total: getNumberValue(row, "Total"),
      };
    });
  };

  const handleImportHistory = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setImporting(true);

    try {
      const fileContent = await file.text();
      const importedInvoices = file.name.toLowerCase().endsWith(".csv")
        ? parseInvoiceCsv(fileContent)
        : (() => {
            const parsed = JSON.parse(fileContent);
            return Array.isArray(parsed) ? parsed : parsed?.invoices;
          })();

      if (!Array.isArray(importedInvoices)) {
        toast.error("Import file must contain an invoices array");
        return;
      }

      const response = await fetch("/api/invoices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          invoices: importedInvoices,
          mode: "preview",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to preview invoice history");
        return;
      }

      setPendingImportInvoices(importedInvoices);
      setImportPreview(result);
      setSelectedMissingTenantNames(result.newTenantNames ?? []);
      toast.success("Import preview ready");
    } catch (error) {
      console.error("Error importing invoice history:", error);
      toast.error("Failed to read import file");
    } finally {
      setImporting(false);
    }
  };

  const applyImport = async (mode: ImportMode) => {
    if (!session?.user?.id || pendingImportInvoices.length === 0) return;

    setImporting(true);

    try {
      const response = await fetch("/api/invoices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          invoices: pendingImportInvoices,
          mode,
          createMissingTenants: selectedMissingTenantNames.length > 0,
          createMissingTenantNames: selectedMissingTenantNames,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to import invoice history");
        return;
      }

      await loadData();
      setImportPreview(null);
      setPendingImportInvoices([]);
      setSelectedMissingTenantNames([]);
      setReplaceConfirmOpen(false);

      const skippedText = result.skippedCount
        ? `, skipped ${result.skippedCount}`
        : "";
      const duplicateText = result.duplicateCount && mode === "merge"
        ? `, ignored ${result.duplicateCount} duplicate(s)`
        : "";
      const tenantText = result.newTenantCount && selectedMissingTenantNames.length > 0
        ? `, created ${result.newTenantCount} tenant(s)`
        : "";
      toast.success(
        `Imported ${result.importedCount} invoice(s)${duplicateText}${tenantText}${skippedText}`,
      );
    } catch (error) {
      console.error("Error importing invoice history:", error);
      toast.error("Failed to import invoice history");
    } finally {
      setImporting(false);
    }
  };

  const selectedMissingTenantNameSet = new Set(selectedMissingTenantNames);
  const unselectedMissingTenants = importPreview?.missingTenants.filter(
    (tenant) => !selectedMissingTenantNameSet.has(tenant.name),
  ) ?? [];
  const skippedMissingTenantInvoiceCount = unselectedMissingTenants.reduce(
    (sum, tenant) => sum + tenant.invoiceCount,
    0,
  );
  const skippedMissingTenantMergeImportCount = unselectedMissingTenants.reduce(
    (sum, tenant) => sum + tenant.mergeImportCount,
    0,
  );
  const previewAppendImportCount = importPreview
    ? importPreview.appendImportCount - skippedMissingTenantInvoiceCount
    : 0;
  const previewReplaceImportCount = importPreview
    ? importPreview.replaceImportCount - skippedMissingTenantInvoiceCount
    : 0;
  const previewMergeImportCount = importPreview
    ? importPreview.mergeImportCount - skippedMissingTenantMergeImportCount
    : 0;
  const previewSkippedCount = importPreview
    ? importPreview.skippedCount + skippedMissingTenantInvoiceCount
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-4 sm:p-6">
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
    <TooltipProvider delayDuration={500}>
      <div className="container mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <FileTextIcon className="shrink-0" />
            Invoice History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View, search, import, and export generated invoices
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ActionTooltip label="Export invoice history as backup JSON or spreadsheet CSV">
            <span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={invoices.length === 0 || importing}
                    className="w-full sm:w-auto"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Export
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Backup and reports</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExportJson(invoices, "all")}>
                    Export all as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportJson(filteredInvoices, "filtered")}
                  >
                    Export filtered as JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportCsv}>
                    Export filtered as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </ActionTooltip>
          <ActionTooltip label="Choose a JSON backup or exported CSV file and preview it before importing">
            <span>
              <Button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
                className="w-full sm:w-auto"
              >
                <UploadIcon className="h-4 w-4" />
                {importing ? "Importing..." : "Import History"}
              </Button>
            </span>
          </ActionTooltip>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,text/csv,.json,.csv"
            className="hidden"
            onChange={handleImportHistory}
          />
        </div>
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
                      <SelectItem key={tenant._id} value={tenant._id}>
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
              {filteredInvoices.map((invoice) => {
                const usedModuleNames = [
                  ...new Set(
                    invoice.calculationBreakdown
                      ?.map((item) => item.moduleName)
                      .filter(Boolean) ?? [],
                  ),
                ];

                return (
                  <Card
                    key={invoice._id}
                    className="cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 break-words text-base font-semibold sm:text-lg">
                              {invoice.tenantName}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="max-w-full shrink truncate"
                            >
                              ID: {invoice._id}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex min-w-0 items-center gap-1">
                              <CalendarIcon className="h-4 w-4 shrink-0" />
                              {new Date(invoice.date).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </div>
                            <div className="flex min-w-0 items-center gap-1">
                              <span className="break-words">
                                Units: {invoice.unitsConsumed.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {usedModuleNames.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Modules used: {usedModuleNames.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="w-full space-y-3 text-left sm:w-auto sm:text-right">
                          <p className="break-words text-xl font-bold text-primary sm:text-2xl">
                            Rs.{" "}
                            {invoice.total.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="break-words text-xs text-muted-foreground sm:text-sm">
                            Rent: Rs. {invoice.baseRent.toLocaleString()} +
                            Electricity: Rs.{" "}
                            {invoice.electricityCost.toLocaleString()}
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="w-full sm:w-auto"
                                disabled={deletingInvoiceId === invoice._id}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Trash2Icon className="h-4 w-4" />
                                {deletingInvoiceId === invoice._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              onClick={(event) => event.stopPropagation()}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the invoice for{" "}
                                  {invoice.tenantName} dated{" "}
                                  {new Date(invoice.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    },
                                  )}
                                  . This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  disabled={deletingInvoiceId === invoice._id}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={deletingInvoiceId === invoice._id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDeleteInvoice(invoice);
                                  }}
                                >
                                  Delete Invoice
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog
        open={!!importPreview}
        onOpenChange={(open) => {
          if (!open && !importing) {
            setImportPreview(null);
            setPendingImportInvoices([]);
            setSelectedMissingTenantNames([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Preview Invoice Import</DialogTitle>
            <DialogDescription className="max-w-2xl">
              Review the file before choosing how to import it. Dependent fields
              will be recalculated using your current tenants and modules. Missing
              tenants with a name and base rent can be created during import.
            </DialogDescription>
          </DialogHeader>
          {importPreview && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                <div className="border bg-background p-4">
                  <p className="text-muted-foreground">File invoices</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {importPreview.totalCount}
                  </p>
                </div>
                <div className="border bg-background p-4">
                  <p className="text-muted-foreground">Valid invoices</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {importPreview.validCount}
                  </p>
                </div>
                <div className="border bg-background p-4">
                  <p className="text-muted-foreground">Duplicates</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {importPreview.duplicateCount}
                  </p>
                </div>
                <div className="border bg-background p-4">
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="mt-2 text-2xl font-semibold text-destructive">
                    {previewSkippedCount}
                  </p>
                </div>
                <div className="border bg-background p-4 col-span-2 md:col-span-1">
                  <p className="text-muted-foreground">New tenants</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {importPreview.newTenantCount}
                  </p>
                </div>
              </div>

              {importPreview.newTenantNames.length > 0 && (
                <div className="border border-primary/20 bg-primary/5 p-4 text-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">
                        Missing tenants found
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Select the tenants you want to create from this import.
                        Unselected tenants and their invoices will be skipped.
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        {importPreview.newTenantNames.join(", ")}
                      </p>
                    </div>
                    <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-72">
                      <ActionTooltip label="Select every missing tenant for creation">
                        <span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedMissingTenantNames(importPreview.newTenantNames)
                            }
                            className="w-full"
                          >
                            Select all
                          </Button>
                        </span>
                      </ActionTooltip>
                      <ActionTooltip label="Deselect every missing tenant and skip their invoices">
                        <span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMissingTenantNames([])}
                            className="w-full"
                          >
                            Skip all
                          </Button>
                        </span>
                      </ActionTooltip>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {importPreview.missingTenants.map((tenant) => {
                      const selected = selectedMissingTenantNameSet.has(tenant.name);

                      return (
                        <ActionTooltip
                          key={tenant.name}
                          label={
                            selected
                              ? "This tenant will be created and its invoices imported"
                              : "This tenant will not be created, so its invoices will be skipped"
                          }
                        >
                          <span>
                            <Button
                              type="button"
                              variant={selected ? "default" : "outline"}
                              className="h-auto w-full justify-between gap-3 px-3 py-2 text-left"
                              onClick={() => {
                                setSelectedMissingTenantNames((current) =>
                                  selected
                                    ? current.filter((name) => name !== tenant.name)
                                    : [...current, tenant.name],
                                );
                              }}
                            >
                              <span className="truncate">{tenant.name}</span>
                              <span className="text-xs opacity-80">
                                {tenant.invoiceCount} invoice(s)
                              </span>
                            </Button>
                          </span>
                        </ActionTooltip>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Creating tenants uses the imported tenant name and base rent.
                    Contacts can be added later from Tenant Management.
                  </p>
                </div>
              )}

              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="border bg-muted/30 p-4">
                  <p className="font-medium">Merge without duplicates</p>
                  <p className="mt-2 text-muted-foreground">
                    Imports {previewMergeImportCount} invoice(s) and skips
                    duplicates. This is the safest option.
                  </p>
                </div>
                <div className="border bg-muted/30 p-4">
                  <p className="font-medium">Append</p>
                  <p className="mt-2 text-muted-foreground">
                    Imports {previewAppendImportCount} invoice(s), including
                    duplicate matches.
                  </p>
                </div>
                <div className="border bg-muted/30 p-4">
                  <p className="font-medium">Replace all</p>
                  <p className="mt-2 text-muted-foreground">
                    Deletes {importPreview.existingCount} existing invoice(s), then
                    imports {previewReplaceImportCount} invoice(s).
                  </p>
                </div>
              </div>

              {skippedMissingTenantInvoiceCount > 0 && (
                <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
                  {skippedMissingTenantInvoiceCount} invoice(s) for unselected
                  missing tenants will be skipped during import.
                </div>
              )}

              {importPreview.skipped.length > 0 && (
                <div className="max-h-40 overflow-y-auto border p-4 text-xs text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground">Skipped rows</p>
                  {importPreview.skipped.slice(0, 5).map((item) => (
                    <p key={`${item.index}-${item.reason}`}>
                      Row {item.index + 1}: {item.reason}
                    </p>
                  ))}
                  {importPreview.skipped.length > 5 && (
                    <p>And {importPreview.skipped.length - 5} more skipped row(s).</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-3 border-t pt-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportPreview(null);
                setPendingImportInvoices([]);
                setSelectedMissingTenantNames([]);
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            <div className="grid gap-2 sm:grid-cols-3">
              <ActionTooltip label="Add every valid invoice from the file, including duplicates">
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => applyImport("append")}
                    disabled={importing || previewAppendImportCount <= 0}
                    className="w-full"
                  >
                    Append
                  </Button>
                </span>
              </ActionTooltip>
              <ActionTooltip label="Delete current history, then import this file after confirmation">
                <span>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setReplaceConfirmOpen(true)}
                    disabled={importing || previewReplaceImportCount <= 0}
                    className="w-full"
                  >
                    Replace All
                  </Button>
                </span>
              </ActionTooltip>
              <ActionTooltip label="Safest option: import only invoices that are not already in history">
                <span className="sm:order-first">
                  <Button
                    type="button"
                    onClick={() => applyImport("merge")}
                    disabled={importing || previewMergeImportCount <= 0}
                    className="w-full"
                  >
                    Merge
                  </Button>
                </span>
              </ActionTooltip>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={replaceConfirmOpen}
        onOpenChange={setReplaceConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all invoice history?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes your current invoice history before importing the
              selected JSON file. This action cannot be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={importing}
              onClick={(event) => {
                event.preventDefault();
                applyImport("replace");
              }}
            >
              Replace History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </TooltipProvider>
  );
}
