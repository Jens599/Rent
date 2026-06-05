import { NextRequest, NextResponse } from "next/server";
import { validateFormula } from "@/lib/calculations/evaluator";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = validateFormula(body.formula || "", body.availableVariables || []);
  return NextResponse.json(result);
}
