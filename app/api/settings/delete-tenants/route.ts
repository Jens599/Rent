import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const deletedCount = await convex.mutation(api.tasks.deleteAllUserTenants, {
      userId: userId as any,
    });

    return NextResponse.json({ count: deletedCount });
  } catch (error) {
    console.error("Error deleting all tenants:", error);
    return NextResponse.json(
      { error: "Failed to delete all tenants" },
      { status: 500 },
    );
  }
}
