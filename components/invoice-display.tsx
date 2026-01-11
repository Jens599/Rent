"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Invoice } from "@/lib/types";

interface InvoiceDisplayProps {
  invoice: Invoice;
}

export function InvoiceDisplay({ invoice }: InvoiceDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="bg-background p-8 print:p-4">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">RENT INVOICE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-none">
                  Tenant Name
                </p>
                <p className="font-semibold text-lg leading-normal">
                  {invoice.tenantName}
                </p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-sm text-muted-foreground leading-none">
                  Invoice Date
                </p>
                <p className="font-semibold leading-normal">
                  {new Date(invoice.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Charges Section */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Charges</h3>
              <div className="space-y-6">
                {/* Base Rent */}
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <p className="font-medium">Base Rent</p>
                    <p className="text-sm text-muted-foreground">
                      (includes utilities)
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    Rs.{" "}
                    {invoice.baseRent.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* Electricity */}
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <p className="font-medium leading-tight">Electricity</p>
                    <p className="text-sm text-muted-foreground leading-normal">
                      Previous: {invoice.previousMonthReading.toFixed(2)} units
                    </p>
                    <p className="text-sm text-muted-foreground leading-normal">
                      Current: {invoice.currentMonthReading.toFixed(2)} units
                    </p>
                    <p className="text-sm text-muted-foreground leading-normal">
                      Units Consumed: {invoice.unitsConsumed.toFixed(2)} × Rs.
                      {(invoice.electricityRate || 15).toFixed(2)}/unit
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    Rs.{" "}
                    {invoice.electricityCost.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center pt-4">
              <p className="font-bold text-xl">Total Amount</p>
              <p className="font-bold text-2xl">
                Rs.{" "}
                {invoice.total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
