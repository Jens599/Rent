export type CalculationInputType =
  | "number"
  | "text"
  | "boolean"
  | "checkbox"
  | "radio"
  | "select";

export interface CalculationModuleInput {
  key: string;
  label: string;
  type: CalculationInputType;
  required: boolean;
  defaultValue?: number | string | boolean;
  helpText?: string;
  options?: string[];
}

export interface CalculationModuleOutput {
  key: string;
  label: string;
  format: "currency" | "number" | "percent";
}

export interface CalculationModuleDependency {
  moduleId: string;
  outputKey: string;
}

export interface CalculationModuleConfig {
  _id?: string;
  userId?: string;
  name: string;
  description?: string;
  enabled: boolean;
  order: number;
  category: "rent" | "electricity" | "tax" | "discount" | "fee" | "total" | "custom";
  inputs: CalculationModuleInput[];
  formula: string;
  output: CalculationModuleOutput;
  dependencies: CalculationModuleDependency[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculationResult {
  moduleId: string;
  moduleName: string;
  outputKey: string;
  outputLabel: string;
  outputFormat: CalculationModuleOutput["format"];
  value: number;
  formula: string;
  inputs: Record<string, number | string | boolean>;
  dependencies: CalculationModuleDependency[];
}

export interface CalculationRunResult {
  results: CalculationResult[];
  total: number;
  errors: string[];
}

export interface FormulaValidationResult {
  valid: boolean;
  errors: string[];
  variables: string[];
}
