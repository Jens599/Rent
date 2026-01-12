import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
  let userId: string | undefined;

  try {
    const body = await request.json();
    userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    logger.info(
      "api_delete_invoices_attempt",
      { userId: userId! },
      { convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL! },
    );

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    try {
      const deletedCount = await convex.mutation(
        api.tasks.deleteAllUserInvoices,
        {
          userId: userId as any,
        },
      );

      logger.info("api_delete_invoices_success", {
        deletedCount,
        userId: userId!,
      });
      return NextResponse.json({ count: deletedCount });
    } catch (convexError) {
      logger.error("api_delete_invoices_convex_failed", convexError as Error, {
        userId: userId!,
      });
      const errorMessage =
        convexError instanceof Error
          ? convexError.message
          : String(convexError);
      return NextResponse.json(
        { error: `Convex error: ${errorMessage}` },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error("api_delete_invoices_failed", error as Error, {
      userId: userId,
    });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 },
    );
  }
}
