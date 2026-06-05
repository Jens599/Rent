import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { authOptions } from "@/lib/auth";
import type { CalculationModuleConfig } from "@/lib/calculations/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id;
}

function cleanModulesForPreset(modules: CalculationModuleConfig[]) {
  const moduleByOutputKey = new Map(
    modules.map((calculationModule) => [calculationModule.output.key, calculationModule]),
  );

  return modules.map((calculationModule) => {
    const { _id, userId, createdAt, updatedAt, ...moduleData } = calculationModule;
    return {
      ...moduleData,
      dependencies: calculationModule.dependencies.map((dependency) => {
        const dependencyModule = moduleByOutputKey.get(dependency.outputKey);
        return {
          moduleId: dependencyModule?.name || dependency.moduleId,
          outputKey: dependency.outputKey,
        };
      }),
    };
  });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const presets = await convex.query(api.tasks.getCalculationModulePresets, {
    userId: userId as any,
  });

  return NextResponse.json(presets);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Preset name is required" }, { status: 400 });
  }

  const modules = await convex.query(api.tasks.getCalculationModules, {
    userId: userId as any,
  });

  if (modules.length === 0) {
    return NextResponse.json({ error: "No modules available to save" }, { status: 400 });
  }

  const preset = await convex.mutation(api.tasks.createCalculationModulePreset, {
    userId: userId as any,
    name,
    description: body.description ? String(body.description) : undefined,
    modules: cleanModulesForPreset(modules as CalculationModuleConfig[]),
  });

  return NextResponse.json(preset);
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const presetId = body.presetId;
  if (!presetId) {
    return NextResponse.json({ error: "Preset ID is required" }, { status: 400 });
  }

  const modules = await convex.query(api.tasks.getCalculationModules, {
    userId: userId as any,
  });

  if (modules.length === 0) {
    return NextResponse.json({ error: "No modules available to save" }, { status: 400 });
  }

  const preset = await convex.mutation(api.tasks.updateCalculationModulePreset, {
    presetId: presetId as any,
    userId: userId as any,
    name: body.name ? String(body.name) : undefined,
    description: body.description ? String(body.description) : undefined,
    modules: cleanModulesForPreset(modules as CalculationModuleConfig[]),
  });

  return NextResponse.json(preset);
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const presetId = request.nextUrl.searchParams.get("id");
  if (!presetId) {
    return NextResponse.json({ error: "Preset ID is required" }, { status: 400 });
  }

  await convex.mutation(api.tasks.deleteCalculationModulePreset, {
    presetId: presetId as any,
  });

  return NextResponse.json({ success: true });
}
