import type { CalculationModuleConfig } from "./types";

export function createDefaultCalculationModules(): CalculationModuleConfig[] {
  return [
    {
      name: "Base Rent",
      description: "Uses the selected tenant's configured base rent.",
      enabled: true,
      order: 1,
      category: "rent",
      inputs: [],
      formula: "tenantBaseRent",
      output: { key: "baseRent", label: "Base Rent", format: "currency" },
      dependencies: [],
    },
    {
      name: "Electricity Usage",
      description: "Calculates consumed electricity units from meter readings.",
      enabled: true,
      order: 2,
      category: "electricity",
      inputs: [
        {
          key: "previousMonthReading",
          label: "Previous Month Reading",
          type: "number",
          required: false,
          exposed: true,
          defaultValue: 0,
          helpText: "Auto-filled from the last invoice when available.",
        },
        {
          key: "currentMonthReading",
          label: "Current Month Reading",
          type: "number",
          required: true,
          exposed: true,
          helpText: "Enter the latest meter reading.",
        },
      ],
      formula: "currentMonthReading - previousMonthReading",
      output: { key: "electricityUnits", label: "Electricity Units", format: "number" },
      dependencies: [],
    },
    {
      name: "Electricity Charge",
      description: "Multiplies electricity units by the configured rate.",
      enabled: true,
      order: 3,
      category: "electricity",
      inputs: [
        {
          key: "electricityRate",
          label: "Electricity Rate",
          type: "number",
          required: true,
          exposed: true,
          defaultValue: 15,
          helpText: "Cost per consumed electricity unit.",
        },
      ],
      formula: "electricityUnits * electricityRate",
      output: { key: "electricityCost", label: "Electricity Charge", format: "currency" },
      dependencies: [{ moduleId: "Electricity Usage", outputKey: "electricityUnits" }],
    },
    {
      name: "Final Rent Total",
      description: "Adds enabled charge modules into the final rent amount.",
      enabled: true,
      order: 4,
      category: "total",
      inputs: [],
      formula: "baseRent + electricityCost",
      output: { key: "total", label: "Final Total", format: "currency" },
      dependencies: [
        { moduleId: "Base Rent", outputKey: "baseRent" },
        { moduleId: "Electricity Charge", outputKey: "electricityCost" },
      ],
    },
  ];
}
