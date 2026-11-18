"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface InvoiceDisplayProps {
  invoice: Invoice;
}

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function InvoiceDisplay({ invoice }: InvoiceDisplayProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [polished, setPolished] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveAsJpeg = async () => {
    if (!invoiceRef.current) return;
    setSaving(true);
    try {
      // Load the image encoder only when the user requests an export.
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `rent-invoice-${format(new Date(invoice.date), "yyyy-MM-dd")}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("Invoice saved as JPEG");
    } catch (error) {
      console.error("Unable to save invoice as JPEG:", error);
      toast.error("Could not save the invoice image");
    } finally {
      setSaving(false);
    }
  };

  const shell = polished
    ? "overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/5"
    : "overflow-hidden border-2 border-slate-300 bg-white text-slate-900";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={polished}
            onChange={(event) => setPolished(event.target.checked)}
            className="size-4 accent-slate-900"
          />
          Polished layout
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon className="size-4" />
            Print
          </Button>
          <Button onClick={saveAsJpeg} disabled={saving}>
            <DownloadIcon className="size-4" />
            {saving ? "Saving…" : "Save as JPEG"}
          </Button>
        </div>
      </div>

      <div
        ref={invoiceRef}
        id="rent-invoice-print-area"
        className={`mx-auto w-full max-w-3xl print:max-w-none ${shell}`}
      >
        <header
          className={
            polished
              ? "flex flex-wrap items-start justify-between gap-6 bg-slate-950 px-8 py-8 text-white sm:px-10"
              : "flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-300 px-8 py-8 sm:px-10"
          }
        >
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                polished ? "text-amber-300" : "text-slate-500"
              }`}
            >
              Rent billing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Invoice
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <p
              className={`text-xs font-medium uppercase tracking-[0.16em] ${
                polished ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Invoice date
            </p>
            <p className="mt-2 text-base font-semibold">
              {format(new Date(invoice.date), "MMMM d, yyyy")}
            </p>
          </div>
        </header>

        <div className="space-y-8 px-8 py-8 sm:px-10 sm:py-10">
          <section
            className={`border-l-4 px-5 py-4 ${
              polished
                ? "border-amber-500 bg-slate-50"
                : "border-slate-400 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Billed to
            </p>
            <p className="mt-2 text-xl font-semibold tracking-tight">
              {invoice.tenantName}
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                Description
              </h3>
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                Amount
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-start justify-between gap-6 py-5">
                <div>
                  <p className="font-semibold">Base rent</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {money(invoice.baseRent)}
                </p>
              </div>

              <div className="flex items-start justify-between gap-6 py-5">
                <div>
                  <p className="font-semibold">Electricity</p>
                  <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-500 sm:grid-cols-2">
                    <span>Previous reading: {invoice.previousMonthReading.toFixed(2)} units</span>
                    <span>Current reading: {invoice.currentMonthReading.toFixed(2)} units</span>
                    <span>Usage: {invoice.unitsConsumed.toFixed(2)} units</span>
                    <span>Rate: {money(invoice.electricityRate ?? 15)} / unit</span>
                  </div>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {money(invoice.electricityCost)}
                </p>
              </div>
            </div>
          </section>

          <footer
            className={`flex flex-wrap items-center justify-between gap-4 px-5 py-5 ${
              polished
                ? "bg-slate-950 text-white"
                : "border-t-2 border-slate-300 bg-slate-50 text-slate-900"
            }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                  polished ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Total due
              </p>
              <p className="mt-1 text-sm">Thank you</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
              {money(invoice.total)}
            </p>
          </footer>
        </div>
      </div>
    </section>
  );
}
