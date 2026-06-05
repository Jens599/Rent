import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  tenants: defineTable({
    userId: v.id("users"),
    name: v.string(),
    baseRent: v.number(),
    contact: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_userId", ["userId"]),

  invoices: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    tenantName: v.string(),
    date: v.string(),
    baseRent: v.number(),
    previousMonthReading: v.number(),
    currentMonthReading: v.number(),
    unitsConsumed: v.number(),
    electricityRate: v.optional(v.number()),
    electricityCost: v.number(),
    total: v.number(),
    calculationBreakdown: v.optional(
      v.array(
        v.object({
          moduleId: v.string(),
          moduleName: v.string(),
          outputKey: v.string(),
          outputLabel: v.string(),
          outputFormat: v.string(),
          value: v.number(),
          formula: v.string(),
          inputs: v.any(),
          dependencies: v.array(
            v.object({
              moduleId: v.string(),
              outputKey: v.string(),
            }),
          ),
        }),
      ),
    ),
  }).index("by_userId", ["userId"]),

  calculationModules: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    order: v.number(),
    category: v.string(),
    inputs: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        type: v.string(),
        required: v.boolean(),
        defaultValue: v.optional(v.any()),
        helpText: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
      }),
    ),
    formula: v.string(),
    output: v.object({
      key: v.string(),
      label: v.string(),
      format: v.string(),
    }),
    dependencies: v.array(
      v.object({
        moduleId: v.string(),
        outputKey: v.string(),
      }),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),

  calculationModulePresets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    modules: v.any(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),

  settings: defineTable({
    electricityRate: v.number(),
    userId: v.id("users"),
  })
    .index("by_single", ["electricityRate"])
    .index("by_userId", ["userId"]),
});
