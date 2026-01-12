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
  }).index("by_userId", ["userId"]),

  settings: defineTable({
    electricityRate: v.number(),
    userId: v.id("users"),
  })
    .index("by_single", ["electricityRate"])
    .index("by_userId", ["userId"]),
});
