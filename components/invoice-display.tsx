"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import {
  DownloadIcon,
  PrinterIcon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { Invoice, PaymentQrSnapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface InvoiceDisplayProps {
  invoice: Invoice;
}

type InvoiceStyle = "classic" | "meter" | "ledger" | "notice" | "receipt";

const styles: { id: InvoiceStyle; label: string }[] = [
  { id: "classic", label: "Current invoice" },
  { id: "meter", label: "House meter" },
  { id: "ledger", label: "Rent ledger" },
  { id: "notice", label: "Room notice" },
  { id: "receipt", label: "Market receipt" },
];

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const extraCharges = (invoice: Invoice) =>
  (invoice.calculationBreakdown ?? []).filter(
    (item) =>
      !["baseRent", "electricityCost", "electricityUnits"].includes(
        item.outputKey,
      ),
  );

function PaymentQrList({
  paymentQrs,
  compact = false,
}: {
  paymentQrs: PaymentQrSnapshot[];
  compact?: boolean;
}) {
  if (paymentQrs.length === 0) return null;

  return (
    <section
      className={`border-t border-dashed ${
        compact ? "pt-4" : "pt-6"
      }`}
    >
      <p
        className={`mb-3 font-semibold uppercase tracking-[0.12em] ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        Pay with
      </p>
      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-1" : "grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"
        }`}
      >
        {paymentQrs.map((paymentQr, index) => (
          <div
            key={`${paymentQr.storageId}-${index}`}
            className={`flex items-center gap-3 bg-white p-3 text-slate-900 ${
              compact ? "text-xs" : "text-sm"
            }`}
            style={{
              borderColor: paymentQr.borderColor ?? "rgb(15 23 42 / 0.15)",
              borderWidth: `${paymentQr.borderWidth ?? 1}px`,
              borderStyle: paymentQr.borderStyle ?? "solid",
            }}
          >
            {paymentQr.imageUrl ? (
              // QR images are served from Convex storage; anonymous CORS keeps JPEG export canvas-safe.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paymentQr.imageUrl}
                alt={`${paymentQr.provider} payment QR`}
                crossOrigin="anonymous"
                className={`shrink-0 bg-white object-contain ${
                  compact ? "size-20" : "size-24"
                }`}
              />
            ) : (
              <div
                className={`grid shrink-0 place-items-center border border-dashed text-[9px] text-slate-500 ${
                  compact ? "size-20" : "size-24"
                }`}
              >
                QR unavailable
              </div>
            )}
            <span className="min-w-0">
              <span className="block font-semibold">{paymentQr.name}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {paymentQr.provider}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChargeRows({
  invoice,
  compact = false,
}: {
  invoice: Invoice;
  compact?: boolean;
}) {
  const extras = extraCharges(invoice);
  return (
    <>
      <div className="flex justify-between gap-4 border-b border-current/15 py-4">
        <span className="font-semibold">Base rent</span>
        <span className="shrink-0 font-semibold tabular-nums">
          {money(invoice.baseRent)}
        </span>
      </div>
      <div className="flex justify-between gap-4 border-b border-current/15 py-4">
        <div className="min-w-0">
          <span className="font-semibold">Electricity</span>
          <div
            className={`mt-2 grid gap-x-4 gap-y-1 text-slate-500 ${
              compact ? "text-[10px]" : "text-xs sm:grid-cols-2"
            }`}
          >
            <span>Previous: {invoice.previousMonthReading.toFixed(2)} units</span>
            <span>Current: {invoice.currentMonthReading.toFixed(2)} units</span>
            <span>Used: {invoice.unitsConsumed.toFixed(2)} units</span>
            <span>Rate: {money(invoice.electricityRate ?? 15)} / unit</span>
          </div>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">
          {money(invoice.electricityCost)}
        </span>
      </div>
      {extras.map((item, index) => (
        <div
          key={`${item.moduleId}-${index}`}
          className="flex justify-between gap-4 border-b border-current/15 py-4"
        >
          <span className="font-semibold">{item.outputLabel}</span>
          <span className="shrink-0 font-semibold tabular-nums">
            {item.outputFormat === "currency" ? "Rs. " : ""}
            {item.value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {item.outputFormat === "percent" ? "%" : ""}
          </span>
        </div>
      ))}
    </>
  );
}

function InvoiceDocument({
  invoice,
  style,
}: {
  invoice: Invoice;
  style: InvoiceStyle;
}) {
  const issued = format(new Date(invoice.date), "MMMM d, yyyy");
  const period = format(new Date(invoice.date), "MMMM yyyy").toUpperCase();
  const extraCount = extraCharges(invoice).length;
  const lineCount = extraCount + 2;
  const paymentQrs = invoice.paymentQrs ?? [];

  if (style === "meter") {
    return (
      <div className="grid overflow-hidden border-[3px] border-lime-500 bg-[#eef4e6] text-[#173238] shadow-sm md:grid-cols-[1fr_260px]">
        <div className="p-6 sm:p-10">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#607177]">
            ● Monthly statement · {issued}
          </p>
          <h2 className="mt-10 text-4xl font-extrabold leading-[.92] tracking-[-.07em] sm:text-6xl">
            Meter
            <br />
            statement<span className="text-lime-600">.</span>
          </h2>
          <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-[#607177]">
            Rent + utilities / {period}
          </p>
          <div className="my-8 border-t border-[#cfd6c6]" />
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#607177]">
            Billed to
          </p>
          <p className="mt-1 text-xl font-semibold">{invoice.tenantName}</p>
          <div className="mt-8">
            <ChargeRows invoice={invoice} />
          </div>
          <PaymentQrList paymentQrs={paymentQrs} />
        </div>
        <aside className="flex flex-col justify-between gap-8 bg-[#173238] p-6 text-white sm:p-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#b7c5c3]">
              Meter movement
            </p>
            <div className="mx-auto my-6 grid size-28 place-items-center rounded-full border border-[#718186] text-center font-mono text-xs text-[#c9ef4b]">
              +{invoice.unitsConsumed.toFixed(2)}
              <br />
              units
            </div>
            <p className="border-t border-[#40545a] pt-3 font-mono text-[10px] leading-6 text-[#b7c5c3]">
              PREVIOUS&nbsp; {invoice.previousMonthReading.toFixed(2)}
              <br />
              CURRENT&nbsp;&nbsp; {invoice.currentMonthReading.toFixed(2)}
            </p>
          </div>
          <div className="border-t border-[#40545a] pt-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b7c5c3]">
              Amount to settle
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#c9ef4b]">
              {money(invoice.total)}
            </p>
          </div>
        </aside>
      </div>
    );
  }

  if (style === "ledger") {
    return (
      <div className="flex min-h-[680px] flex-col border-[3px] border-[#54785c] bg-[#f2ead8] p-6 text-[#202a24] sm:p-10">
        <div className="flex justify-between gap-4 border-b border-[#aeb5a8] pb-4 font-mono text-[10px] uppercase tracking-[.12em]">
          <span>House account / Rent</span>
          <span className="text-right">Monthly statement<br />Issued {issued}</span>
        </div>
        <div className="grid gap-4 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <h2 className="font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-7xl">
            Monthly
            <br />
            account.
          </h2>
          <p className="font-mono text-[10px] uppercase leading-5 text-[#69736a] sm:text-right">
            Billing period
            <br />
            <strong className="text-[#202a24]">{period}</strong>
          </p>
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-3 border-y border-[#aeb5a8] py-4 text-sm">
          <strong className="font-mono text-[10px] uppercase tracking-wider">
            Resident
          </strong>
          <span className="font-serif text-lg">{invoice.tenantName}</span>
        </div>
        <div className="mt-8 grid grid-cols-[1fr_auto] border-b border-[#879187] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#69736a]">
          <span>Entry · {lineCount} lines</span>
          <span>Debit</span>
        </div>
        <div className="text-sm">
          <ChargeRows invoice={invoice} />
        </div>
        <div className="mt-6 flex justify-end gap-6 border-b border-[#aeb5a8] py-5">
          <span className="self-center font-mono text-[10px] font-bold uppercase tracking-wider text-[#657064]">
            Balance due
          </span>
          <strong className="font-serif text-3xl tracking-tight">
            {money(invoice.total)}
          </strong>
        </div>
        {paymentQrs.length > 0 && (
          <div className="mt-6">
            <PaymentQrList paymentQrs={paymentQrs} compact />
          </div>
        )}
        <div className="mt-auto flex justify-between gap-3 border-t border-[#aeb5a8] pt-4 font-mono text-[9px] uppercase tracking-wider text-[#687268]">
          <span>Rent / utilities</span>
          <span>Meter readings verified</span>
        </div>
      </div>
    );
  }

  if (style === "notice") {
    return (
      <div className="grid overflow-hidden border-[3px] border-[#2447f5] bg-[#edf1ff] text-[#10151c] md:grid-cols-[1fr_190px]">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#2447f5]">
            <span>House account / {period}</span>
            <span className="bg-[#ff6945] px-2 py-1 text-[#10151c]">
              Rent statement
            </span>
          </div>
          <h2 className="mt-12 text-5xl font-extrabold leading-[.84] tracking-[-.09em] sm:text-7xl">
            Rent
            <br />
            account<span className="text-[#ff6945]">.</span>
          </h2>
          <span className="mt-4 inline-block bg-[#2447f5] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {invoice.tenantName}
          </span>
          <div className="mt-8 flex justify-between gap-3 border-y border-[#b5b9c8] py-3 text-xs">
            <span>
              <span className="block font-mono text-[9px] uppercase text-[#6b7278]">
                Issued
              </span>
              <strong>{issued}</strong>
            </span>
            <span className="text-right">
              <span className="block font-mono text-[9px] uppercase text-[#6b7278]">
                Period
              </span>
              <strong>{period}</strong>
            </span>
          </div>
          <div className="mt-5 text-sm">
            <ChargeRows invoice={invoice} />
          </div>
          <PaymentQrList paymentQrs={paymentQrs} compact />
        </div>
        <aside className="flex flex-col justify-between gap-8 bg-[#2447f5] p-6 text-white">
          <span className="text-4xl font-extrabold tracking-[-.1em]">
            R<span className="text-[#ff6945]">/</span>26
          </span>
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#cbd4ff]">
              Total amount
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold tracking-tight">
              {money(invoice.total)}
            </p>
          </div>
          <p className="border-t border-white/30 pt-4 font-mono text-[9px] leading-5 text-[#d3dcff]">
            Monthly rent account.
            <br />
            Thank you.
          </p>
        </aside>
      </div>
    );
  }

  if (style === "receipt") {
    return (
      <div className="bg-[#e8f0e9] p-5 sm:p-8">
        <div className="mx-auto max-w-md border-[3px] border-[#f0643e] bg-[#fffef8] px-6 py-8 font-mono text-[#20201e] shadow-md sm:px-10">
          <header className="text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full border-2 border-[#bd3429] font-sans text-lg font-black text-[#bd3429]">
              R
            </div>
            <h2 className="font-sans text-2xl font-black tracking-[-.06em]">
              RENT RECEIPT
            </h2>
            <p className="mt-1 text-[9px] uppercase tracking-[.1em]">
              Monthly account statement
            </p>
          </header>
          <div className="my-5 border-t border-dashed border-[#77776f]" />
          <div className="text-center text-[10px]">
            <p className="font-bold tracking-[.1em]">TENANT STATEMENT</p>
            <div className="mt-2 flex justify-between">
              <span>{issued.toUpperCase()}</span>
              <span>{period}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between gap-3 border-b border-[#77776f] pb-3 text-[10px]">
            <span>RESIDENT</span>
            <strong className="text-right">{invoice.tenantName.toUpperCase()}</strong>
          </div>
          <div className="mt-4 flex justify-between border-b border-[#20201e] pb-2 text-[10px] font-bold uppercase">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="text-[11px]">
            <ChargeRows invoice={invoice} compact />
          </div>
          <div className="mt-4 flex justify-between border-y-2 border-[#20201e] py-3 text-xs font-black">
            <span>Total due</span>
            <strong className="text-[#bd3429]">{money(invoice.total)}</strong>
          </div>
          <p className="mt-5 text-center text-[10px] font-bold">THANK YOU</p>
          <p className="mt-2 text-center text-[9px] leading-5 text-[#686861]">
            KEEP THIS STATEMENT
            <br />
            FOR YOUR RECORDS
          </p>
          {paymentQrs.length > 0 && (
            <div className="mt-5">
              <PaymentQrList paymentQrs={paymentQrs} compact />
            </div>
          )}
          <div
            aria-hidden="true"
            className="my-5 h-9 bg-[repeating-linear-gradient(90deg,#20201e_0_2px,transparent_2px_4px,#20201e_4px_5px,transparent_5px_8px,#20201e_8px_12px,transparent_12px_14px)]"
          />
          <p className="text-center text-[9px] tracking-[.18em]">
            RENT · {period}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/5">
      <header className="flex flex-wrap items-start justify-between gap-6 bg-slate-950 px-8 py-8 text-white sm:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            Rent billing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Invoice</h2>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
            Invoice date
          </p>
          <p className="mt-2 text-base font-semibold">{issued}</p>
        </div>
      </header>
      <div className="space-y-8 px-8 py-8 sm:px-10 sm:py-10">
        <section className="border-l-4 border-amber-500 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Billed to
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight">
            {invoice.tenantName}
          </p>
        </section>
        <section>
          <div className="mb-3 flex items-end justify-between border-b border-slate-200 pb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
            <h3>Description</h3>
            <span>Amount</span>
          </div>
          <div className="divide-y divide-slate-100">
            <ChargeRows invoice={invoice} />
          </div>
        </section>
        <PaymentQrList paymentQrs={paymentQrs} />
        <footer className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 px-5 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
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
  );
}

export function InvoiceDisplay({ invoice }: InvoiceDisplayProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<InvoiceStyle>("classic");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const createJpeg = async () => {
    if (!invoiceRef.current) throw new Error("Invoice is not ready");
    const { toJpeg } = await import("html-to-image");
    const dataUrl = await toJpeg(invoiceRef.current, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const downloadBlob = (blob: Blob) => {
    const link = document.createElement("a");
    link.download = `rent-invoice-${format(new Date(invoice.date), "yyyy-MM-dd")}.jpg`;
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  };

  const saveAsJpeg = async () => {
    setSaving(true);
    try {
      downloadBlob(await createJpeg());
      toast.success("Invoice saved as JPEG");
    } catch (error) {
      console.error("Unable to save invoice as JPEG:", error);
      toast.error("Could not save the invoice image");
    } finally {
      setSaving(false);
    }
  };

  const shareInvoice = async () => {
    setSharing(true);
    try {
      const blob = await createJpeg();
      const file = new File(
        [blob],
        `rent-invoice-${format(new Date(invoice.date), "yyyy-MM-dd")}.jpg`,
        { type: "image/jpeg" },
      );
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Rent invoice — ${invoice.tenantName}`,
          text: `Rent invoice dated ${format(new Date(invoice.date), "MMMM d, yyyy")}`,
          files: [file],
        });
      } else {
        toast.info(
          "Image sharing isn’t supported in this browser. Save the JPEG and share it from your device.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Unable to share invoice:", error);
      toast.error("Could not prepare the invoice for sharing");
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="space-y-5">
      <fieldset className="print:hidden">
        <legend className="mb-2 text-sm font-semibold">Invoice style</legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {styles.map((item, index) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-2 border p-3 text-sm transition-colors ${
                style === item.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="invoice-style"
                value={item.id}
                checked={style === item.id}
                onChange={() => setStyle(item.id)}
                className="accent-primary"
              />
              <span>
                <span className="mr-1 font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <PrinterIcon className="size-4" />
          Print
        </Button>
        <Button variant="outline" onClick={shareInvoice} disabled={sharing}>
          <Share2Icon className="size-4" />
          {sharing ? "Preparing…" : "Share"}
        </Button>
        <Button onClick={saveAsJpeg} disabled={saving}>
          <DownloadIcon className="size-4" />
          {saving ? "Saving…" : "Save as JPEG"}
        </Button>
      </div>

      <div
        ref={invoiceRef}
        id="rent-invoice-print-area"
        className={`mx-auto w-full print:max-w-none ${
          style === "receipt" ? "max-w-md" : "max-w-3xl"
        }`}
      >
        <InvoiceDocument invoice={invoice} style={style} />
      </div>
    </section>
  );
}
