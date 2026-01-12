import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Default settings
const DEFAULT_SETTINGS = {
  electricityRate: 15, // Default Rs. 15 per unit
};

// GET - Get current settings
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

    const settings = await convex.query(api.tasks.getSettings, {
      userId: userId as any,
    });

    return NextResponse.json(settings || DEFAULT_SETTINGS);
  } catch (error) {
    logger.error("api_settings_get_failed", error as Error, { userId });
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 },
    );
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  let settings: any;

  try {
    settings = await request.json();

    if (!settings.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Validate settings
    if (
      typeof settings.electricityRate !== "number" ||
      settings.electricityRate <= 0
    ) {
      return NextResponse.json(
        { error: "Electricity rate must be a positive number" },
        { status: 400 },
      );
    }

    const result = await convex.mutation(api.tasks.upsertSettings, {
      userId: settings.userId,
      electricityRate: settings.electricityRate,
    });

    return NextResponse.json({ success: true, settingsId: result });
  } catch (error) {
    logger.error("api_settings_post_failed", error as Error, { settings });
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
