import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Tenant } from "@/lib/types";

const TENANTS_DIR = path.join(process.cwd(), "data", "tenants");
const TENANTS_FILE = path.join(TENANTS_DIR, "tenants.json");

// Ensure directory exists
async function ensureDirectory() {
  try {
    await fs.mkdir(TENANTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// GET - Get all tenants
export async function GET() {
  try {
    await ensureDirectory();
    
    try {
      const data = await fs.readFile(TENANTS_FILE, "utf-8");
      const tenants: Tenant[] = JSON.parse(data);
      return NextResponse.json(tenants);
    } catch (error) {
      // File doesn't exist, return empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error reading tenants:", error);
    return NextResponse.json(
      { error: "Failed to read tenants" },
      { status: 500 }
    );
  }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  try {
    await ensureDirectory();
    
    const tenant: Omit<Tenant, "id" | "createdAt"> = await request.json();
    
    // Read existing tenants
    let tenants: Tenant[] = [];
    try {
      const data = await fs.readFile(TENANTS_FILE, "utf-8");
      tenants = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    // Create new tenant
    const newTenant: Tenant = {
      id: Date.now().toString(),
      ...tenant,
      createdAt: new Date().toISOString(),
    };
    
    tenants.push(newTenant);
    
    // Save to file
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    return NextResponse.json(newTenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}

// PUT - Update tenant
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectory();
    
    const updatedTenant: Tenant = await request.json();
    
    // Read existing tenants
    let tenants: Tenant[] = [];
    try {
      const data = await fs.readFile(TENANTS_FILE, "utf-8");
      tenants = JSON.parse(data);
    } catch (error) {
      return NextResponse.json(
        { error: "No tenants found" },
        { status: 404 }
      );
    }
    
    // Find and update tenant
    const index = tenants.findIndex((t) => t.id === updatedTenant.id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }
    
    tenants[index] = updatedTenant;
    
    // Save to file
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json(
      { error: "Failed to update tenant" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectory();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }
    
    // Read existing tenants
    let tenants: Tenant[] = [];
    try {
      const data = await fs.readFile(TENANTS_FILE, "utf-8");
      tenants = JSON.parse(data);
    } catch (error) {
      return NextResponse.json(
        { error: "No tenants found" },
        { status: 404 }
      );
    }
    
    // Remove tenant
    tenants = tenants.filter((t) => t.id !== id);
    
    // Save to file
    await fs.writeFile(TENANTS_FILE, JSON.stringify(tenants, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
