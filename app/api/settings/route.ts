import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Settings } from "@/lib/types";

const SETTINGS_DIR = path.join(process.cwd(), "data", "settings");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

// Default settings
const DEFAULT_SETTINGS: Settings = {
  electricityRate: 15, // Default Rs. 15 per unit
};

// Ensure directory exists
async function ensureDirectory() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// GET - Get current settings
export async function GET() {
  try {
    await ensureDirectory();

    try {
      const data = await fs.readFile(SETTINGS_FILE, "utf-8");
      const settings: Settings = JSON.parse(data);
      return NextResponse.json(settings);
    } catch (error) {
      // File doesn't exist, return default settings
      return NextResponse.json(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error("Error reading settings:", error);
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 },
    );
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    await ensureDirectory();

    const settings: Settings = await request.json();

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

    // Save to file
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
