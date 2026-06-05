import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { authOptions } from "@/lib/auth";
import { validateFormula } from "@/lib/calculations/evaluator";
import type { CalculationModuleConfig } from "@/lib/calculations/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id;
}

function getAvailableVariables(module: CalculationModuleConfig, modules: CalculationModuleConfig[]) {
  const inputKeys = module.inputs.map((input) => input.key);
  const outputKeys = modules.map((item) => item.output.key);
  return ["tenantBaseRent", ...inputKeys, ...outputKeys];
}

function validateModule(module: CalculationModuleConfig, modules: CalculationModuleConfig[]) {
  const errors: string[] = [];
  if (!module.name.trim()) errors.push("Module name is required.");
  if (!module.output.key.trim()) errors.push("Output key is required.");
  if (!module.output.label.trim()) errors.push("Output label is required.");

  const inputKeys = new Set<string>();
  for (const input of module.inputs) {
    if (!input.key.trim()) errors.push("Every input needs a key.");
    if (!input.label.trim()) errors.push("Every input needs a label.");
    if (inputKeys.has(input.key)) errors.push(`Input key "${input.key}" is duplicated.`);
    inputKeys.add(input.key);
  }

  const formulaValidation = validateFormula(module.formula, getAvailableVariables(module, modules));
  errors.push(...formulaValidation.errors);

  return errors;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let modules = await convex.query(api.tasks.getCalculationModules, {
    userId: userId as any,
  });

  if (modules.length === 0) {
    await convex.mutation(api.tasks.seedDefaultCalculationModules, {
      userId: userId as any,
    });
    modules = await convex.query(api.tasks.getCalculationModules, {
      userId: userId as any,
    });
  }

  return NextResponse.json(modules);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const moduleData = await request.json();
  const modules = await convex.query(api.tasks.getCalculationModules, {
    userId: userId as any,
  });
  const errors = validateModule(moduleData, modules as CalculationModuleConfig[]);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const created = await convex.mutation(api.tasks.createCalculationModule, {
    ...moduleData,
    userId: userId as any,
  });

  return NextResponse.json(created);
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const moduleData = await request.json();
  if (!moduleData.moduleId) {
    return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
  }

  const modules = await convex.query(api.tasks.getCalculationModules, {
    userId: userId as any,
  });
  const errors = validateModule(moduleData, modules as CalculationModuleConfig[]);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { moduleId, _id, _creationTime, createdAt, updatedAt, ...updates } = moduleData;
  const updated = await convex.mutation(api.tasks.updateCalculationModule, {
    ...updates,
    moduleId: moduleId as any,
    userId: userId as any,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const moduleId = request.nextUrl.searchParams.get("id");
  if (!moduleId) {
    return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
  }

  await convex.mutation(api.tasks.deleteCalculationModule, {
    moduleId: moduleId as any,
  });

  return NextResponse.json({ success: true });
}
