import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET - Get all invoices or filter by tenantId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const userId = searchParams.get("userId");

  try {
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    let invoices;
    if (tenantId) {
      invoices = await convex.query(api.tasks.getInvoicesByTenant, {
        userId: userId as any,
        tenantId: tenantId as any,
      });
    } else {
      invoices = await convex.query(api.tasks.getInvoices, {
        userId: userId as any,
      });
    }

    // Sort by date (newest first)
    invoices.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json(invoices);
  } catch (error) {
    logger.error("api_invoices_get_failed", error as Error, {
      userId,
      tenantId,
    });
    return NextResponse.json(
      { error: "Failed to read invoices" },
      { status: 500 },
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  let invoiceData: any;

  try {
    invoiceData = await request.json();

    if (!invoiceData.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const newInvoice = await convex.mutation(
      api.tasks.createInvoice,
      invoiceData,
    );

    return NextResponse.json(newInvoice);
  } catch (error) {
    logger.error("api_invoices_post_failed", error as Error, { invoiceData });
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}

// DELETE - Delete invoice
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("id");

  try {
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    await convex.mutation(api.tasks.deleteInvoice, {
      invoiceId: invoiceId as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("api_invoices_delete_failed", error as Error, { invoiceId });
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 },
    );
  }
}

// Utility function to get last invoice for a tenant
export async function getLastInvoiceForTenant(tenantId: string) {
  try {
    const invoices = await convex.query(api.tasks.getInvoicesByTenant, {
      userId: null as any, // This might need to be adjusted based on your auth requirements
      tenantId: tenantId as any,
    });

    // Sort by date (newest first) and return the first one
    if (invoices && invoices.length > 0) {
      invoices.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      return invoices[0];
    }

    return null;
  } catch (error) {
    logger.error("get_last_invoice_for_tenant_failed", error as Error, {
      tenantId,
    });
    throw error;
  }
}
