import type {
  CalculationModuleConfig,
  CalculationResult,
  CalculationRunResult,
  FormulaValidationResult,
} from "./types";

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

const IDENTIFIER_RE = /[a-zA-Z_][a-zA-Z0-9_.]*/y;
const NUMBER_RE = /\d+(?:\.\d+)?/y;

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (["+", "-", "*", "/"].includes(char)) {
      tokens.push({ type: "operator", value: char as "+" | "-" | "*" | "/" });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    NUMBER_RE.lastIndex = index;
    const numberMatch = NUMBER_RE.exec(expression);
    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index = NUMBER_RE.lastIndex;
      continue;
    }

    IDENTIFIER_RE.lastIndex = index;
    const identifierMatch = IDENTIFIER_RE.exec(expression);
    if (identifierMatch) {
      tokens.push({ type: "identifier", value: identifierMatch[0] });
      index = IDENTIFIER_RE.lastIndex;
      continue;
    }

    throw new Error(`Unsupported character "${char}" in formula.`);
  }

  return tokens;
}

class Parser {
  private index = 0;

  constructor(
    private tokens: Token[],
    private values: Record<string, number>,
  ) {}

  parse() {
    const value = this.parseExpression();
    if (this.index < this.tokens.length) {
      throw new Error("Formula contains an unexpected value near the end.");
    }
    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (this.peekOperator("+") || this.peekOperator("-")) {
      const operator = this.tokens[this.index++] as Extract<Token, { type: "operator" }>;
      const right = this.parseTerm();
      value = operator.value === "+" ? value + right : value - right;
    }

    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();

    while (this.peekOperator("*") || this.peekOperator("/")) {
      const operator = this.tokens[this.index++] as Extract<Token, { type: "operator" }>;
      const right = this.parseFactor();
      if (operator.value === "/" && right === 0) {
        throw new Error("Formula divides by zero.");
      }
      value = operator.value === "*" ? value * right : value / right;
    }

    return value;
  }

  private parseFactor(): number {
    const token = this.tokens[this.index];
    if (!token) {
      throw new Error("Formula ended unexpectedly.");
    }

    if (token.type === "operator" && token.value === "-") {
      this.index += 1;
      return -this.parseFactor();
    }

    if (token.type === "number") {
      this.index += 1;
      return token.value;
    }

    if (token.type === "identifier") {
      this.index += 1;
      if (!(token.value in this.values)) {
        throw new Error(`Formula uses "${token.value}", but that value is missing.`);
      }
      return this.values[token.value];
    }

    if (token.type === "paren" && token.value === "(") {
      this.index += 1;
      const value = this.parseExpression();
      const next = this.tokens[this.index];
      if (!next || next.type !== "paren" || next.value !== ")") {
        throw new Error("Formula has an opening parenthesis without a closing parenthesis.");
      }
      this.index += 1;
      return value;
    }

    throw new Error("Formula contains an unexpected symbol.");
  }

  private peekOperator(value: "+" | "-" | "*" | "/") {
    const token = this.tokens[this.index];
    return token?.type === "operator" && token.value === value;
  }
}

export function getFormulaVariables(expression: string): string[] {
  return [...new Set(tokenize(expression).filter((token) => token.type === "identifier").map((token) => token.value))];
}

export function evaluateFormula(expression: string, values: Record<string, number>) {
  return new Parser(tokenize(expression), values).parse();
}

export function validateFormula(
  expression: string,
  availableVariables: string[] = [],
): FormulaValidationResult {
  const errors: string[] = [];
  let variables: string[] = [];

  if (!expression.trim()) {
    return { valid: false, errors: ["Formula is required."], variables: [] };
  }

  try {
    variables = getFormulaVariables(expression);
    const available = new Set(availableVariables);
    for (const variable of variables) {
      if (availableVariables.length > 0 && !available.has(variable)) {
        errors.push(`Formula uses "${variable}", but that value is not available.`);
      }
    }
    const dummyValues = Object.fromEntries(variables.map((variable) => [variable, 1]));
    evaluateFormula(expression, dummyValues);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Formula is invalid.");
  }

  return { valid: errors.length === 0, errors, variables };
}

export function sortModulesByDependency(modules: CalculationModuleConfig[]) {
  const enabledModules = modules.filter((calculationModule) => calculationModule.enabled);
  const byIdOrName = new Map<string, CalculationModuleConfig>();
  for (const calculationModule of enabledModules) {
    if (calculationModule._id) byIdOrName.set(calculationModule._id, calculationModule);
    byIdOrName.set(calculationModule.name, calculationModule);
  }

  const sorted: CalculationModuleConfig[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const errors: string[] = [];

  const getKey = (calculationModule: CalculationModuleConfig) => calculationModule._id || calculationModule.name;

  function visit(calculationModule: CalculationModuleConfig, path: string[]) {
    const key = getKey(calculationModule);
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      errors.push(`Circular dependency detected: ${[...path, calculationModule.name].join(" -> ")}.`);
      return;
    }

    visiting.add(key);
    for (const dependency of calculationModule.dependencies) {
      const dependencyModule = byIdOrName.get(dependency.moduleId);
      if (!dependencyModule) {
        errors.push(`${calculationModule.name} depends on a module that is missing or disabled.`);
        continue;
      }
      visit(dependencyModule, [...path, calculationModule.name]);
    }
    visiting.delete(key);
    visited.add(key);
    sorted.push(calculationModule);
  }

  for (const calculationModule of enabledModules.sort((a, b) => a.order - b.order)) {
    visit(calculationModule, []);
  }

  return { sorted, errors };
}

export function runCalculationModules(
  modules: CalculationModuleConfig[],
  inputValues: Record<string, number | string | boolean>,
): CalculationRunResult {
  const { sorted, errors } = sortModulesByDependency(modules);
  const numericValues: Record<string, number> = {};
  const results: CalculationResult[] = [];

  for (const [key, value] of Object.entries(inputValues)) {
    if (typeof value === "number") numericValues[key] = value;
    if (typeof value === "boolean") numericValues[key] = value ? 1 : 0;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      numericValues[key] = Number(value);
    }
  }

  for (const calculationModule of sorted) {
    const moduleInputs: Record<string, number | string | boolean> = {};
    for (const input of calculationModule.inputs) {
      const value = inputValues[input.key] ?? input.defaultValue;
      if (input.required && (value === undefined || value === "")) {
        errors.push(`${calculationModule.name} requires ${input.label}.`);
      }
      if (value !== undefined) moduleInputs[input.key] = value;
      if ((input.type === "number" || input.type === "select" || input.type === "radio") && value !== undefined && value !== "") {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
          errors.push(`${input.label} must be a number.`);
        } else {
          numericValues[input.key] = numberValue;
        }
      }
      if ((input.type === "boolean" || input.type === "checkbox") && typeof value === "boolean") {
        numericValues[input.key] = value ? 1 : 0;
      }
    }

    try {
      const value = evaluateFormula(calculationModule.formula, numericValues);
      if (!Number.isFinite(value)) {
        errors.push(`${calculationModule.name} produced an invalid number.`);
        continue;
      }
      numericValues[calculationModule.output.key] = value;
      results.push({
        moduleId: calculationModule._id || calculationModule.name,
        moduleName: calculationModule.name,
        outputKey: calculationModule.output.key,
        outputLabel: calculationModule.output.label,
        outputFormat: calculationModule.output.format,
        value,
        formula: calculationModule.formula,
        inputs: moduleInputs,
        dependencies: calculationModule.dependencies,
      });
    } catch (error) {
      errors.push(`${calculationModule.name}: ${error instanceof Error ? error.message : "Calculation failed."}`);
    }
  }

  const finalTotal = results.find((result) => result.outputKey === "total")?.value;
  return {
    results,
    total: finalTotal ?? results.reduce((sum, result) => result.outputFormat === "currency" ? sum + result.value : sum, 0),
    errors,
  };
}
