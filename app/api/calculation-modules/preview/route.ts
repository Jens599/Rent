import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { authOptions } from "@/lib/auth";
import { runCalculationModules } from "@/lib/calculations/evaluator";
import type { CalculationModuleConfig } from "@/lib/calculations/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const modules = body.modules || await convex.query(api.tasks.getCalculationModules, {
    userId: session.user.id as any,
  });

  const result = runCalculationModules(modules as CalculationModuleConfig[], body.inputs || {});
  return NextResponse.json(result);
}
