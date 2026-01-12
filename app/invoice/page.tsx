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
import { CalendarIcon, FileTextIcon, HomeIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InvoiceDisplay } from "@/components/invoice-display";
import type { Tenant, Invoice } from "@/lib/types";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

const DEFAULT_ELECTRICITY_RATE = 15; // Default Rs. 15 per unit

export default function InvoicePage() {
  const { data: session } = useSession();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(
    null,
  );
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
    if (selectedTenant) {
      // Auto-populate base rent
      setBaseRent(selectedTenant.baseRent.toString());

      // Load last invoice to get previous month reading
      loadLastInvoice(selectedTenant._id);
    } else {
      // Reset form when no tenant selected
      setBaseRent("");
      setPreviousMonthReading("");
      setCurrentMonthReading("");
    }
  }, [selectedTenant]);

  // Refresh previous reading when page loads (to get latest data)
  React.useEffect(() => {
    if (selectedTenant && tenants.length > 0) {
      loadLastInvoice(selectedTenant._id);
    }
  }, []);

  const loadSettings = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/settings?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setElectricityRate(data.electricityRate);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadTenants = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/tenants?userId=${session.user.id}`);
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const loadLastInvoice = async (tenantId: string) => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(
        `/api/invoices?userId=${session.user.id}&tenantId=${tenantId}`,
      );
      if (response.ok) {
        const invoices = await response.json();
        if (invoices && invoices.length > 0) {
          // Get the most recent invoice (already sorted by date in API)
          const lastInvoice = invoices[0];
          // Auto-populate previous month reading from last invoice's current reading
          setPreviousMonthReading(lastInvoice.currentMonthReading.toString());
        } else {
          // No previous invoice, clear field
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
    if (!selectedTenant) {
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

    // Current reading validation
    if (!currentMonthReading) {
      newErrors.currentReading = "Please enter current month reading";
    } else {
      const current = parseFloat(currentMonthReading);
      if (isNaN(current) || current < 0) {
        newErrors.currentReading =
          "Current reading must be a non-negative number";
      } else if (previousMonthReading) {
        const previous = parseFloat(previousMonthReading);
        if (!isNaN(previous) && previous >= 0 && previous > current) {
          newErrors.currentReading =
            "Current reading cannot be less than previous reading";
        }
      }
    }

    // Previous reading validation (optional but if provided, must be valid)
    if (previousMonthReading) {
      const previous = parseFloat(previousMonthReading);
      if (isNaN(previous) || previous < 0) {
        newErrors.previousReading =
          "Previous reading must be a non-negative number";
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

    if (!selectedTenant) return;

    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        userId: session.user.id,
        tenantId: selectedTenant._id,
        tenantName: selectedTenant.name,
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

  const handleBackToTenants = () => {
    setSelectedTenant(null);
    setGeneratedInvoice(null);
    setCurrentMonthReading("");
    setBaseRent("");
    setPreviousMonthReading("");
  };

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileTextIcon />
            Generate Rent Invoice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create invoices for your tenants with automatic electricity
            calculations
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {!selectedTenant ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Tenant</CardTitle>
              <CardDescription>
                Choose a tenant to generate an invoice for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tenants available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add tenants first to generate invoices
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.map((tenant) => (
                    <Card key={tenant._id} className="transition-all border-2">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{tenant.name}</h3>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Base Rent:{" "}
                              <span className="font-medium">
                                Rs. {tenant.baseRent.toLocaleString()}
                              </span>
                            </p>
                            {tenant.contact && (
                              <p className="text-sm text-muted-foreground">
                                Contact:{" "}
                                <span className="font-medium">
                                  {tenant.contact}
                                </span>
                              </p>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 [a]:hover:bg-primary/80 hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTenantSelect(tenant);
                            }}
                          >
                            Generate Invoice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : !generatedInvoice ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Fill in the details to generate an invoice for{" "}
                  {selectedTenant.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleBackToTenants}
                className="flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                Back to Tenants
              </Button>
            </div>
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
                  <FieldLabel>Selected Tenant</FieldLabel>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTenant.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base Rent: Rs. {selectedTenant.baseRent.toLocaleString()}
                    </p>
                  </div>
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
                  <FieldLabel>Base Rent (Rs.)</FieldLabel>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Rs. {selectedTenant.baseRent.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-populated from selected tenant
                    </p>
                  </div>
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setInvoiceDateTime(new Date());
                      setBaseRent(selectedTenant.baseRent.toString());
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
