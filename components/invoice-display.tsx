"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Invoice } from "@/lib/types"
import { PrinterIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

interface InvoiceDisplayProps {
  invoice: Invoice
}

export function InvoiceDisplay({ invoice }: InvoiceDisplayProps) {
  const invoiceRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleCopyScreenshot = async () => {
    if (!invoiceRef.current) return

    try {
      const html2canvas = (await import("html2canvas")).default
      
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      })

      canvas.toBlob(
        (blob) => {
          if (blob) {
            navigator.clipboard
              .write([
                new ClipboardItem({
                  "image/png": blob,
                }),
              ])
              .then(() => {
                toast.success("Invoice screenshot copied to clipboard!")
              })
              .catch((err) => {
                console.error("Clipboard error:", err)
                toast.error("Failed to copy to clipboard. Please try printing instead.")
              })
          }
        },
        "image/png",
        1.0
      )
    } catch (error) {
      console.error("Error copying screenshot:", error)
      toast.error("Failed to copy screenshot. Please try printing instead.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <PrinterIcon />
          Print
        </Button>
        <Button onClick={handleCopyScreenshot} variant="outline" size="sm">
          <CopyIcon />
          Copy Screenshot
        </Button>
      </div>

      <div ref={invoiceRef} className="bg-white p-8 print:p-4">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">RENT INVOICE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tenant Name</p>
                <p className="font-semibold text-lg">{invoice.tenantName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-semibold">
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
              <div className="space-y-3">
                {/* Base Rent */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Base Rent</p>
                    <p className="text-sm text-muted-foreground">
                      (includes utilities)
                    </p>
                  </div>
                  <p className="font-semibold">
                    Rs. {invoice.baseRent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Electricity */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Electricity</p>
                    <p className="text-sm text-muted-foreground">
                      Previous: {invoice.previousMonthReading.toFixed(2)} units → Current:{" "}
                      {invoice.currentMonthReading.toFixed(2)} units
                      <br />
                      Units Consumed: {invoice.unitsConsumed.toFixed(2)} × Rs. 15/unit
                    </p>
                  </div>
                  <p className="font-semibold">
                    Rs. {invoice.electricityCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center pt-2">
              <p className="font-bold text-xl">Total Amount</p>
              <p className="font-bold text-2xl">
                Rs. {invoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
