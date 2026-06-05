export interface Tenant {
  _id: string;
  userId: string;
  name: string;
  baseRent: number;
  contact?: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  userId: string;
  tenantId: string;
  tenantName: string;
  date: string;
  baseRent: number;
  previousMonthReading: number;
  currentMonthReading: number;
  unitsConsumed: number;
  electricityRate?: number;
  electricityCost: number;
  total: number;
  calculationBreakdown?: CalculationBreakdownItem[];
}

export interface CalculationBreakdownItem {
  moduleId: string;
  moduleName: string;
  outputKey: string;
  outputLabel: string;
  outputFormat: string;
  value: number;
  formula: string;
  inputs: Record<string, number | string | boolean>;
  dependencies: Array<{ moduleId: string; outputKey: string }>;
}

export interface Settings {
  electricityRate: number;
  moduleReorderMode?: "drag" | "buttons";
}

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}
