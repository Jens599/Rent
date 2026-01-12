import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET - Get all tenants
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const tenants = await convex.query(api.tasks.getTenants, {
      userId: userId as any,
    });

    return NextResponse.json(tenants);
  } catch (error) {
    logger.error("api_tenants_get_failed", error as Error, { userId });
    return NextResponse.json(
      { error: "Failed to read tenants" },
      { status: 500 },
    );
  }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  let tenantData: any;

  try {
    tenantData = await request.json();

    if (!tenantData.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const newTenant = await convex.mutation(api.tasks.createTenant, tenantData);

    return NextResponse.json(newTenant);
  } catch (error) {
    logger.error("api_tenants_post_failed", error as Error, { tenantData });
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 },
    );
  }
}

// PUT - Update tenant
export async function PUT(request: NextRequest) {
  let updatedTenant: any;

  try {
    updatedTenant = await request.json();

    if (!updatedTenant.tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    const result = await convex.mutation(api.tasks.updateTenant, updatedTenant);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("api_tenants_put_failed", error as Error, { updatedTenant });
    return NextResponse.json(
      { error: "Failed to update tenant" },
      { status: 500 },
    );
  }
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("id");

  try {
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    await convex.mutation(api.tasks.deleteTenant, {
      tenantId: tenantId as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("api_tenants_delete_failed", error as Error, { tenantId });
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 },
    );
  }
}
