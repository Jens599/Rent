import { NextRequest, NextResponse } from "next/server";
import { getLastInvoiceForTenant } from "../route";

// GET - Get last invoice for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }
    
    const lastInvoice = await getLastInvoiceForTenant(tenantId);
    
    return NextResponse.json(lastInvoice);
  } catch (error) {
    console.error("Error getting last invoice:", error);
    return NextResponse.json(
      { error: "Failed to get last invoice" },
      { status: 500 }
    );
  }
}
