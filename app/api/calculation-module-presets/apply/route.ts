import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { authOptions } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.presetId) {
    return NextResponse.json({ error: "Preset ID is required" }, { status: 400 });
  }

  const count = await convex.mutation(api.tasks.applyCalculationModulePreset, {
    userId: session.user.id as any,
    presetId: body.presetId as any,
  });

  return NextResponse.json({ count });
}
