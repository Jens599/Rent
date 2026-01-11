import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Invoice } from "@/lib/types";

const INVOICES_DIR = path.join(process.cwd(), "data", "invoices");
const INVOICES_FILE = path.join(INVOICES_DIR, "invoices.json");

// Ensure directory exists
async function ensureDirectory() {
  try {
    await fs.mkdir(INVOICES_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// GET - Get all invoices or filter by tenantId
export async function GET(request: NextRequest) {
  try {
    await ensureDirectory();
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    
    try {
      const data = await fs.readFile(INVOICES_FILE, "utf-8");
      let invoices: Invoice[] = JSON.parse(data);
      
      // Filter by tenantId if provided
      if (tenantId) {
        invoices = invoices.filter((inv) => inv.tenantId === tenantId);
      }
      
      // Sort by date (newest first)
      invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return NextResponse.json(invoices);
    } catch (error) {
      // File doesn't exist, return empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error reading invoices:", error);
    return NextResponse.json(
      { error: "Failed to read invoices" },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    await ensureDirectory();
    
    const invoiceData: Omit<Invoice, "id"> = await request.json();
    
    // Read existing invoices
    let invoices: Invoice[] = [];
    try {
      const data = await fs.readFile(INVOICES_FILE, "utf-8");
      invoices = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    // Create new invoice
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      ...invoiceData,
    };
    
    invoices.push(newInvoice);
    
    // Save to file
    await fs.writeFile(INVOICES_FILE, JSON.stringify(invoices, null, 2));
    
    return NextResponse.json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// GET last invoice for a tenant
export async function getLastInvoiceForTenant(tenantId: string): Promise<Invoice | null> {
  try {
    await ensureDirectory();
    
    try {
      const data = await fs.readFile(INVOICES_FILE, "utf-8");
      const invoices: Invoice[] = JSON.parse(data);
      
      // Filter by tenantId and sort by date
      const tenantInvoices = invoices
        .filter((inv) => inv.tenantId === tenantId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return tenantInvoices.length > 0 ? tenantInvoices[0] : null;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}
