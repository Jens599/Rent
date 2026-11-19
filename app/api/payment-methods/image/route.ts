import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const storageId = new URL(request.url).searchParams.get("storageId");
  if (!storageId) {
    return NextResponse.json({ error: "Storage ID is required" }, { status: 400 });
  }

  try {
    const storageUrl = await convex.query(api.tasks.getPaymentQrStorageUrl, {
      storageId: storageId as any,
    });
    if (!storageUrl) {
      return NextResponse.json({ error: "QR image not found" }, { status: 404 });
    }
    const response = await fetch(storageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "QR image not found" }, { status: 404 });
    }
    const contentType = response.headers.get("content-type") ?? "image/png";
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load QR image" },
      { status: 500 },
    );
  }
}
