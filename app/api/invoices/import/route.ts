import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { runCalculationModules } from "@/lib/calculations/evaluator";
import type { CalculationModuleConfig } from "@/lib/calculations/types";
import { logger } from "@/lib/logger";
import type { Invoice, Tenant } from "@/lib/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type ImportMode = "preview" | "merge" | "append" | "replace";

type ImportableInvoice = Partial<Invoice> & {
  calculationInputs?: Record<string, number | string | boolean>;
};

type TenantRecord = Omit<Tenant, "_id" | "userId"> & {
  _id: Id<"tenants">;
  userId: Id<"users">;
};

type InvoiceImportInput = Omit<Invoice, "_id" | "userId" | "tenantId"> & {
  userId: Id<"users">;
  tenantId: Id<"tenants">;
};

type PreparedInvoice = {
  sourceIndex: number;
  duplicate: boolean;
  missingTenant: boolean;
  missingTenantName?: string;
  invoice: InvoiceImportInput;
};

const getNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value: number) => Math.round(value * 100) / 100;

const getDuplicateKey = (invoice: Pick<Invoice, "tenantName" | "date" | "previousMonthReading" | "currentMonthReading" | "total">) => [
  invoice.tenantName.trim().toLowerCase(),
  new Date(invoice.date).toISOString(),
  round(invoice.previousMonthReading),
  round(invoice.currentMonthReading),
  round(invoice.total),
].join("|");

const getCalculationInputs = (invoice: ImportableInvoice) => {
  const inputs: Record<string, number | string | boolean> = {
    ...(invoice.calculationInputs ?? {}),
  };

  for (const item of invoice.calculationBreakdown ?? []) {
    Object.assign(inputs, item.inputs);
  }

  return inputs;
};

async function prepareInvoices(
  userId: Id<"users">,
  invoices: ImportableInvoice[],
  missingTenantMode: "preview" | "create-selected" | "skip",
  createMissingTenantNames: Set<string>,
) {
  const [tenants, settings, existingInvoices] = await Promise.all([
    convex.query(api.tasks.getTenants, { userId }),
    convex.query(api.tasks.getSettings, { userId }),
    convex.query(api.tasks.getInvoices, { userId }),
  ]);

  let modules = await convex.query(api.tasks.getCalculationModules, { userId });

  if (modules.length === 0) {
    await convex.mutation(api.tasks.seedDefaultCalculationModules, { userId });
    modules = await convex.query(api.tasks.getCalculationModules, { userId });
  }

  const tenantList = [...(tenants as TenantRecord[])];
  const existingTenantIds = new Set(tenantList.map((tenant) => tenant._id));
  const existingTenantNames = new Set(tenantList.map((tenant) => tenant.name));
  const moduleList = modules as CalculationModuleConfig[];
  const existingKeys = new Set(
    (existingInvoices as Invoice[]).map((invoice) => getDuplicateKey(invoice)),
  );
  const seenImportKeys = new Set<string>();
  const newTenantNames = new Set<string>();
  const prepared: PreparedInvoice[] = [];
  const skipped: Array<{ index: number; reason: string }> = [];

  for (const [index, invoice] of invoices.entries()) {
    let tenant = tenantList.find(
      (item) => item._id === invoice.tenantId || item.name === invoice.tenantName,
    );
    const missingTenant = !(
      (invoice.tenantId && existingTenantIds.has(invoice.tenantId as Id<"tenants">)) ||
      (invoice.tenantName && existingTenantNames.has(invoice.tenantName))
    );

    if (missingTenant && !tenant) {
      if (!invoice.tenantName) {
        skipped.push({ index, reason: "Tenant name is required" });
        continue;
      }

      const baseRent = getNumber(invoice.baseRent);
      if (baseRent <= 0) {
        skipped.push({
          index,
          reason: `Base rent is required to create tenant ${invoice.tenantName}`,
        });
        continue;
      }

      const shouldCreateTenant = createMissingTenantNames.has(invoice.tenantName);

      if (
        missingTenantMode === "skip" ||
        (missingTenantMode === "create-selected" && !shouldCreateTenant)
      ) {
        skipped.push({
          index,
          reason: `Tenant not found for ${invoice.tenantName}`,
        });
        continue;
      }

      if (missingTenantMode === "create-selected") {
        tenant = (await convex.mutation(api.tasks.createTenant, {
          userId,
          name: invoice.tenantName,
          baseRent,
        })) as TenantRecord;
      } else {
        tenant = {
          _id: `preview-${invoice.tenantName}` as Id<"tenants">,
          userId,
          name: invoice.tenantName,
          baseRent,
          createdAt: new Date().toISOString(),
        };
      }

      tenantList.push(tenant);
      newTenantNames.add(tenant.name);
    }

    if (!tenant) {
      skipped.push({ index, reason: "Tenant could not be resolved" });
      continue;
    }

    const date = invoice.date ? new Date(invoice.date) : new Date();
    if (Number.isNaN(date.getTime())) {
      skipped.push({ index, reason: "Invoice date is invalid" });
      continue;
    }

    const previousMonthReading = getNumber(invoice.previousMonthReading);
    const currentMonthReading = getNumber(invoice.currentMonthReading);
    if (previousMonthReading < 0 || currentMonthReading < 0) {
      skipped.push({ index, reason: "Meter readings must be non-negative" });
      continue;
    }

    if (currentMonthReading < previousMonthReading) {
      skipped.push({
        index,
        reason: "Current reading cannot be less than previous reading",
      });
      continue;
    }

    const electricityRate = getNumber(
      invoice.electricityRate,
      settings?.electricityRate ?? 0,
    );
    const calculationInputs = {
      ...getCalculationInputs(invoice),
      tenantBaseRent: tenant.baseRent,
      previousMonthReading,
      currentMonthReading,
      electricityRate,
    };

    const calculation = runCalculationModules(moduleList, calculationInputs);
    if (calculation.errors.length > 0) {
      skipped.push({ index, reason: calculation.errors.join(" ") });
      continue;
    }

    const getResultValue = (key: string) =>
      calculation.results.find((result) => result.outputKey === key)?.value;

    const importedInvoice = {
      userId,
      tenantId: tenant._id as Id<"tenants">,
      tenantName: tenant.name,
      date: date.toISOString(),
      baseRent: getResultValue("baseRent") ?? tenant.baseRent,
      previousMonthReading,
      currentMonthReading,
      unitsConsumed:
        getResultValue("electricityUnits") ??
        currentMonthReading - previousMonthReading,
      electricityRate,
      electricityCost: getResultValue("electricityCost") ?? 0,
      total: calculation.total,
      calculationBreakdown: calculation.results,
    };
    const duplicateKey = getDuplicateKey(importedInvoice);
    const duplicate = existingKeys.has(duplicateKey) || seenImportKeys.has(duplicateKey);

    seenImportKeys.add(duplicateKey);
    prepared.push({
      sourceIndex: index,
      duplicate,
      missingTenant,
      missingTenantName: missingTenant ? tenant.name : undefined,
      invoice: importedInvoice,
    });
  }

  const missingTenantInvoices = prepared.filter((item) => item.missingTenant);
  const missingTenants = [...newTenantNames].map((name) => {
    const tenantInvoices = missingTenantInvoices.filter(
      (item) => item.missingTenantName === name,
    );

    return {
      name,
      invoiceCount: tenantInvoices.length,
      mergeImportCount: tenantInvoices.filter((item) => !item.duplicate).length,
    };
  });

  return {
    prepared,
    skipped,
    existingCount: (existingInvoices as Invoice[]).length,
    newTenantCount: newTenantNames.size,
    newTenantNames: [...newTenantNames],
    missingTenants,
    missingTenantInvoiceCount: missingTenantInvoices.length,
    missingTenantMergeImportCount: missingTenantInvoices.filter(
      (item) => !item.duplicate,
    ).length,
  };
}

export async function POST(request: NextRequest) {
  let payload:
    | {
        userId?: string;
        invoices?: ImportableInvoice[];
        mode?: ImportMode;
        createMissingTenants?: boolean;
        createMissingTenantNames?: string[];
      }
    | undefined;

  try {
    payload = await request.json();

    if (!payload?.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(payload.invoices)) {
      return NextResponse.json(
        { error: "Invoices must be an array" },
        { status: 400 },
      );
    }

    const mode = payload.mode ?? "preview";
    const userId = payload.userId as Id<"users">;
    const createMissingTenantNames = new Set(
      payload.createMissingTenantNames ?? [],
    );
    const missingTenantMode = mode === "preview"
      ? "preview"
      : payload.createMissingTenants
        ? "create-selected"
        : "skip";
    const {
      prepared,
      skipped,
      existingCount,
      newTenantCount,
      newTenantNames,
      missingTenants,
      missingTenantInvoiceCount,
      missingTenantMergeImportCount,
    } = await prepareInvoices(
      userId,
      payload.invoices,
      missingTenantMode,
      createMissingTenantNames,
    );
    const duplicates = prepared.filter((item) => item.duplicate);
    const importable = mode === "merge"
      ? prepared.filter((item) => !item.duplicate)
      : prepared;

    if (mode === "preview") {
      return NextResponse.json({
        mode,
        totalCount: payload.invoices.length,
        validCount: prepared.length,
        duplicateCount: duplicates.length,
        skippedCount: skipped.length,
        mergeImportCount: prepared.length - duplicates.length,
        appendImportCount: prepared.length,
        replaceImportCount: prepared.length,
        existingCount,
        newTenantCount,
        newTenantNames,
        missingTenants,
        missingTenantInvoiceCount,
        missingTenantMergeImportCount,
        skipped,
        duplicates: duplicates.map((item) => ({ index: item.sourceIndex })),
      });
    }

    if (mode === "replace") {
      await convex.mutation(api.tasks.deleteAllUserInvoices, { userId });
    }

    const imported: Invoice[] = [];
    for (const item of importable) {
      const created = await convex.mutation(api.tasks.createInvoice, item.invoice);
      imported.push(created as Invoice);
    }

    return NextResponse.json({
      mode,
      importedCount: imported.length,
      duplicateCount: duplicates.length,
      skippedCount: skipped.length,
      newTenantCount,
      newTenantNames,
      missingTenants,
      missingTenantInvoiceCount,
      missingTenantMergeImportCount,
      imported,
      skipped,
    });
  } catch (error) {
    logger.error("api_invoices_import_failed", error as Error, {
      invoiceCount: payload?.invoices?.length,
      userId: payload?.userId,
      mode: payload?.mode,
    });
    return NextResponse.json(
      { error: "Failed to import invoices" },
      { status: 500 },
    );
  }
}
