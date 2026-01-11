"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceDisplay } from "@/components/invoice-display"
import type { Tenant, Invoice } from "@/lib/types"
import { FileTextIcon } from "lucide-react"
import { toast } from "sonner"

const ELECTRICITY_RATE = 15 // Rs. 15 per unit

export default function InvoicePage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>("")
  const [invoiceDate, setInvoiceDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [baseRent, setBaseRent] = React.useState<string>("")
  const [previousMonthReading, setPreviousMonthReading] = React.useState<string>("")
  const [currentMonthReading, setCurrentMonthReading] = React.useState<string>("")
  const [generatedInvoice, setGeneratedInvoice] = React.useState<Invoice | null>(null)
  const [loading, setLoading] = React.useState(false)

  // Load tenants
  React.useEffect(() => {
    loadTenants()
  }, [])

  // Load tenant data and previous invoice when tenant is selected
  React.useEffect(() => {
    if (selectedTenantId) {
      const tenant = tenants.find((t) => t.id === selectedTenantId)
      if (tenant) {
        // Auto-populate base rent
        setBaseRent(tenant.baseRent.toString())
        
        // Load last invoice to get previous month reading
        loadLastInvoice(selectedTenantId)
      }
    } else {
      // Reset form when no tenant selected
      setBaseRent("")
      setPreviousMonthReading("")
    }
  }, [selectedTenantId, tenants])

  const loadTenants = async () => {
    try {
      const response = await fetch("/api/tenants")
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error("Error loading tenants:", error)
    }
  }

  const loadLastInvoice = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/invoices/last?tenantId=${tenantId}`)
      if (response.ok) {
        const lastInvoice = await response.json()
        if (lastInvoice) {
          // Auto-populate previous month reading from last invoice's current reading
          setPreviousMonthReading(lastInvoice.currentMonthReading.toString())
        } else {
          // No previous invoice, clear the field
          setPreviousMonthReading("")
        }
      }
    } catch (error) {
      console.error("Error loading last invoice:", error)
    }
  }

  // Calculate values
  const unitsConsumed = React.useMemo(() => {
    const prev = parseFloat(previousMonthReading) || 0
    const curr = parseFloat(currentMonthReading) || 0
    return Math.max(0, curr - prev)
  }, [previousMonthReading, currentMonthReading])

  const electricityCost = React.useMemo(() => {
    return unitsConsumed * ELECTRICITY_RATE
  }, [unitsConsumed])

  const total = React.useMemo(() => {
    const rent = parseFloat(baseRent) || 0
    return rent + electricityCost
  }, [baseRent, electricityCost])

  const handleGenerateInvoice = async () => {
    if (!selectedTenantId || !invoiceDate || !baseRent || !currentMonthReading) {
      toast.error("Please fill in all required fields")
      return
    }

    const tenant = tenants.find((t) => t.id === selectedTenantId)
    if (!tenant) return

    setLoading(true)

    try {
      const invoiceData: Omit<Invoice, "id"> = {
        tenantId: selectedTenantId,
        tenantName: tenant.name,
        date: invoiceDate,
        baseRent: parseFloat(baseRent),
        previousMonthReading: parseFloat(previousMonthReading) || 0,
        currentMonthReading: parseFloat(currentMonthReading),
        unitsConsumed,
        electricityCost,
        total,
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const newInvoice = await response.json()
        setGeneratedInvoice(newInvoice)
        toast.success("Invoice generated successfully")
      } else {
        toast.error("Failed to generate invoice")
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast.error("Failed to generate invoice")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setGeneratedInvoice(null)
    setCurrentMonthReading("")
    // Keep tenant, date, base rent, and previous reading
  }

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileTextIcon />
          Generate Rent Invoice
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create invoices for your tenants with automatic electricity calculations
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
                e.preventDefault()
                handleGenerateInvoice()
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tenant">Tenant *</FieldLabel>
                  <Select
                    value={selectedTenantId}
                    onValueChange={setSelectedTenantId}
                    required
                  >
                    <SelectTrigger id="tenant" className="w-full">
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
                            {tenant.name} (Rs. {tenant.baseRent.toLocaleString()})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="date">Invoice Date *</FieldLabel>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="baseRent">Base Rent (Rs.) *</FieldLabel>
                  <Input
                    id="baseRent"
                    type="number"
                    step="0.01"
                    value={baseRent}
                    onChange={(e) => setBaseRent(e.target.value)}
                    required
                    placeholder="Enter base rent"
                  />
                  {selectedTenant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: Rs. {selectedTenant.baseRent.toLocaleString()}
                    </p>
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
                      onChange={(e) => setPreviousMonthReading(e.target.value)}
                      placeholder="Auto-filled from last invoice"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {previousMonthReading
                        ? "Auto-filled from last invoice"
                        : "Enter manually if no previous invoice"}
                    </p>
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
                      onChange={(e) => setCurrentMonthReading(e.target.value)}
                      required
                      placeholder="Enter current reading"
                    />
                  </Field>
                </div>

                {/* Calculation Preview */}
                {currentMonthReading && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Units Consumed:
                          </span>
                          <span className="font-medium">{unitsConsumed.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Electricity Cost (Rs. {ELECTRICITY_RATE}/unit):
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
                  <Button type="submit" disabled={loading || tenants.length === 0}>
                    {loading ? "Generating..." : "Generate Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedTenantId("")
                      setInvoiceDate(new Date().toISOString().split("T")[0])
                      setBaseRent("")
                      setPreviousMonthReading("")
                      setCurrentMonthReading("")
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
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              Generate Another Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
