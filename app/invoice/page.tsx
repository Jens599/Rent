"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileTextIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InvoiceDisplay } from "@/components/invoice-display";
import type { Tenant, Invoice } from "@/lib/types";
import { toast } from "sonner";

const DEFAULT_ELECTRICITY_RATE = 15; // Default Rs. 15 per unit

export default function InvoicePage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>("");
  const [invoiceDateTime, setInvoiceDateTime] = React.useState<Date>(
    new Date(),
  );
  const [baseRent, setBaseRent] = React.useState<string>("");
  const [previousMonthReading, setPreviousMonthReading] =
    React.useState<string>("");
  const [currentMonthReading, setCurrentMonthReading] =
    React.useState<string>("");
  const [electricityRate, setElectricityRate] = React.useState<number>(15);
  const [generatedInvoice, setGeneratedInvoice] =
    React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Load tenants and settings
  React.useEffect(() => {
    loadTenants();
    loadSettings();
  }, []);

  // Load tenant data and previous invoice when tenant is selected
  React.useEffect(() => {
    if (selectedTenantId) {
      const tenant = tenants.find((t) => t.id === selectedTenantId);
      if (tenant) {
        // Auto-populate base rent
        setBaseRent(tenant.baseRent.toString());

        // Load last invoice to get previous month reading
        loadLastInvoice(selectedTenantId);
      }
    } else {
      // Reset form when no tenant selected
      setBaseRent("");
      setPreviousMonthReading("");
      setCurrentMonthReading("");
    }
  }, [selectedTenantId, tenants]);

  // Refresh previous reading when page loads (to get latest data)
  React.useEffect(() => {
    if (selectedTenantId && tenants.length > 0) {
      loadLastInvoice(selectedTenantId);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setElectricityRate(data.electricityRate);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const loadLastInvoice = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/invoices/last?tenantId=${tenantId}`);
      if (response.ok) {
        const lastInvoice = await response.json();
        if (lastInvoice) {
          // Auto-populate previous month reading from last invoice's current reading
          setPreviousMonthReading(lastInvoice.currentMonthReading.toString());
        } else {
          // No previous invoice, clear the field
          setPreviousMonthReading("");
        }
      }
    } catch (error) {
      console.error("Error loading last invoice:", error);
    }
  };

  // Calculate values
  const unitsConsumed = React.useMemo(() => {
    const prev = parseFloat(previousMonthReading) || 0;
    const curr = parseFloat(currentMonthReading) || 0;
    return Math.max(0, curr - prev);
  }, [previousMonthReading, currentMonthReading]);

  const electricityCost = React.useMemo(() => {
    return unitsConsumed * electricityRate;
  }, [unitsConsumed, electricityRate]);

  const total = React.useMemo(() => {
    const rent = parseFloat(baseRent) || 0;
    return rent + electricityCost;
  }, [baseRent, electricityCost]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Tenant validation
    if (!selectedTenantId) {
      newErrors.tenant = "Please select a tenant";
    }

    // Date validation
    if (!invoiceDateTime) {
      newErrors.date = "Please select an invoice date";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(invoiceDateTime);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.date = "Invoice date cannot be in the future";
      }
    }

    // Base rent validation
    if (!baseRent) {
      newErrors.baseRent = "Please enter base rent";
    } else {
      const rent = parseFloat(baseRent);
      if (isNaN(rent) || rent <= 0) {
        newErrors.baseRent = "Base rent must be a positive number";
      } else if (rent > 1000000) {
        newErrors.baseRent = "Base rent seems unusually high";
      }
    }

    // Current reading validation
    if (!currentMonthReading) {
      newErrors.currentReading = "Please enter current month reading";
    } else {
      const current = parseFloat(currentMonthReading);
      if (isNaN(current) || current < 0) {
        newErrors.currentReading =
          "Current reading must be a non-negative number";
      }
    }

    // Previous reading validation (optional but if provided, must be valid)
    if (previousMonthReading) {
      const previous = parseFloat(previousMonthReading);
      const current = parseFloat(currentMonthReading);
      if (isNaN(previous) || previous < 0) {
        newErrors.previousReading =
          "Previous reading must be a non-negative number";
      } else if (current && previous > current) {
        newErrors.previousReading =
          "Previous reading cannot be greater than current reading";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateInvoice = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (!tenant) return;

    setLoading(true);

    try {
      const invoiceData: Omit<Invoice, "id"> = {
        tenantId: selectedTenantId,
        tenantName: tenant.name,
        date: invoiceDateTime.toISOString(),
        baseRent: parseFloat(baseRent),
        previousMonthReading: parseFloat(previousMonthReading) || 0,
        currentMonthReading: parseFloat(currentMonthReading),
        unitsConsumed,
        electricityRate,
        electricityCost,
        total,
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const newInvoice = await response.json();
        setGeneratedInvoice(newInvoice);
        toast.success("Invoice generated successfully");
      } else {
        toast.error("Failed to generate invoice");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedInvoice(null);
    setCurrentMonthReading("");
    // Keep tenant, date, base rent, and previous reading
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileTextIcon />
          Generate Rent Invoice
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create invoices for your tenants with automatic electricity
          calculations
        </p>
      </div>

      {!generatedInvoice ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Fill in the details to generate an invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateInvoice();
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tenant">Tenant *</FieldLabel>
                  <Select
                    value={selectedTenantId}
                    onValueChange={(value) => {
                      setSelectedTenantId(value);
                      if (errors.tenant) {
                        setErrors((prev) => ({ ...prev, tenant: "" }));
                      }
                    }}
                    required
                  >
                    <SelectTrigger id="tenant" aria-invalid={!!errors.tenant}>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No tenants available. Add tenants first.
                        </SelectItem>
                      ) : (
                        tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} (Rs.{" "}
                            {tenant.baseRent.toLocaleString()})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.tenant && <FieldError>{errors.tenant}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel>Invoice Date & Time</FieldLabel>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(invoiceDateTime, "PPP 'at' p")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current date and time will be saved
                    </p>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="baseRent">Base Rent (Rs.) *</FieldLabel>
                  <Input
                    id="baseRent"
                    type="number"
                    step="0.01"
                    value={baseRent}
                    onChange={(e) => {
                      setBaseRent(e.target.value);
                      if (errors.baseRent) {
                        setErrors((prev) => ({ ...prev, baseRent: "" }));
                      }
                    }}
                    aria-invalid={!!errors.baseRent}
                    required
                    placeholder="Enter base rent"
                    className="transition-all duration-200 hover:border-primary focus:scale-[1.02]"
                  />
                  {errors.baseRent && (
                    <FieldError>{errors.baseRent}</FieldError>
                  )}
                  {selectedTenant && !errors.baseRent && (
                    <FieldDescription>
                      Default: Rs. {selectedTenant.baseRent.toLocaleString()}
                    </FieldDescription>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="previousReading">
                      Previous Month Reading
                    </FieldLabel>
                    <Input
                      id="previousReading"
                      type="number"
                      step="0.01"
                      value={previousMonthReading}
                      onChange={(e) => {
                        setPreviousMonthReading(e.target.value);
                        if (errors.previousReading) {
                          setErrors((prev) => ({
                            ...prev,
                            previousReading: "",
                          }));
                        }
                      }}
                      aria-invalid={!!errors.previousReading}
                      placeholder="Auto-filled from last invoice"
                      className="transition-all duration-200 hover:border-primary focus:scale-[1.02]"
                    />
                    {errors.previousReading && (
                      <FieldError>{errors.previousReading}</FieldError>
                    )}
                    {!errors.previousReading && (
                      <FieldDescription>
                        {previousMonthReading
                          ? "Auto-filled from last invoice"
                          : "Enter manually if no previous invoice"}
                      </FieldDescription>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="currentReading">
                      Current Month Reading *
                    </FieldLabel>
                    <Input
                      id="currentReading"
                      type="number"
                      step="0.01"
                      value={currentMonthReading}
                      onChange={(e) => {
                        setCurrentMonthReading(e.target.value);
                        if (errors.currentReading) {
                          setErrors((prev) => ({
                            ...prev,
                            currentReading: "",
                          }));
                        }
                      }}
                      aria-invalid={!!errors.currentReading}
                      required
                      placeholder="Enter current reading"
                      className="transition-all duration-200 hover:border-primary focus:scale-[1.02]"
                    />
                    {errors.currentReading && (
                      <FieldError>{errors.currentReading}</FieldError>
                    )}
                  </Field>
                </div>

                {/* Current Rate Display */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Current Electricity Rate
                        </p>
                        <p className="text-xs text-muted-foreground">
                          From settings. Change in Settings page if needed.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          Rs. {electricityRate.toFixed(2)}/unit
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculation Preview */}
                {currentMonthReading && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Units Consumed:
                          </span>
                          <span className="font-medium">
                            {unitsConsumed.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Electricity Cost (Rs. {electricityRate.toFixed(2)}
                            /unit):
                          </span>
                          <span className="font-medium">
                            Rs. {electricityCost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-lg">
                            Rs. {total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    disabled={loading || tenants.length === 0}
                  >
                    {loading ? "Generating..." : "Generate Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedTenantId("");
                      setInvoiceDateTime(new Date());
                      setBaseRent("");
                      setPreviousMonthReading("");
                      setCurrentMonthReading("");
                    }}
                  >
                    Reset Form
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <InvoiceDisplay invoice={generatedInvoice} />
        </div>
      )}
    </div>
  );
}
