import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "../lib/logger";
import { createDefaultCalculationModules } from "../lib/calculations/default-modules";

// User operations
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    // Return the complete user object with the generated ID
    return {
      _id: userId,
      ...args,
      createdAt: new Date().toISOString(),
    };
  },
});

export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

// Tenant operations
export const createTenant = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    baseRent: v.number(),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenantId = await ctx.db.insert("tenants", {
      ...args,
      createdAt: new Date().toISOString(),
    });
    // Return the complete tenant object with the generated ID
    return {
      _id: tenantId,
      ...args,
      createdAt: new Date().toISOString(),
    };
  },
});

export const getTenants = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return tenants;
  },
});

export const updateTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.optional(v.string()),
    baseRent: v.optional(v.number()),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, ...updates } = args;
    await ctx.db.patch(tenantId, updates);
    return tenantId;
  },
});

export const deleteTenant = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tenantId);
    return args.tenantId;
  },
});

// Invoice operations
export const createInvoice = mutation({
  args: {
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
    calculationBreakdown: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const invoiceId = await ctx.db.insert("invoices", args);
    // Return the complete invoice object with the generated ID
    return {
      _id: invoiceId,
      ...args,
    };
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // First delete all invoices for this user
    const userInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const invoice of userInvoices) {
      await ctx.db.delete(invoice._id);
    }

    // Then delete all tenants for this user
    const userTenants = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const tenant of userTenants) {
      await ctx.db.delete(tenant._id);
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);
    return args.userId;
  },
});

export const deleteAllUserInvoices = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const userInvoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      logger.info(
        "delete_all_user_invoices",
        { invoiceCount: userInvoices.length },
        { userId: args.userId },
      );

      for (const invoice of userInvoices) {
        logger.info("delete_invoice", { invoiceId: invoice._id });
        await ctx.db.delete(invoice._id);
      }

      return userInvoices.length;
    } catch (error: unknown) {
      logger.error("delete_all_user_invoices_failed", error as Error, {
        userId: args.userId,
      });
      throw error;
    }
  },
});

export const deleteAllUserTenants = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userTenants = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const tenant of userTenants) {
      await ctx.db.delete(tenant._id);
    }

    return userTenants.length;
  },
});

export const getUserSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0,
    );
    const totalTenants = tenants.length;

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats: {
        totalInvoices,
        totalRevenue,
        totalTenants,
      },
    };
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.email !== undefined) {
      updates.email = args.email;
    }

    await ctx.db.patch(args.userId, updates);

    // Return the updated user object
    const updatedUser = await ctx.db.get(args.userId);
    return updatedUser;
  },
});

export const getInvoices = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return invoices;
  },
});

export const getInvoicesByTenant = query({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .collect();
    return invoices;
  },
});

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invoiceId);
    return args.invoiceId;
  },
});

// Calculation module operations
const calculationModuleArgs = {
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
      exposed: v.optional(v.boolean()),
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
};

export const getCalculationModules = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("calculationModules")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return modules.sort((a, b) => a.order - b.order);
  },
});

export const seedDefaultCalculationModules = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existingModules = await ctx.db
      .query("calculationModules")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (existingModules.length > 0) {
      return existingModules.length;
    }

    const now = new Date().toISOString();
    for (const calculationModule of createDefaultCalculationModules()) {
      await ctx.db.insert("calculationModules", {
        ...calculationModule,
        userId: args.userId,
        description: calculationModule.description,
        category: calculationModule.category,
        createdAt: now,
        updatedAt: now,
      });
    }

    return createDefaultCalculationModules().length;
  },
});

export const resetCalculationModules = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existingModules = await ctx.db
      .query("calculationModules")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const calculationModule of existingModules) {
      await ctx.db.delete(calculationModule._id);
    }

    const now = new Date().toISOString();
    for (const calculationModule of createDefaultCalculationModules()) {
      await ctx.db.insert("calculationModules", {
        ...calculationModule,
        userId: args.userId,
        description: calculationModule.description,
        category: calculationModule.category,
        createdAt: now,
        updatedAt: now,
      });
    }

    return createDefaultCalculationModules().length;
  },
});

export const createCalculationModule = mutation({
  args: calculationModuleArgs,
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const moduleId = await ctx.db.insert("calculationModules", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(moduleId);
  },
});

export const updateCalculationModule = mutation({
  args: {
    moduleId: v.id("calculationModules"),
    ...calculationModuleArgs,
  },
  handler: async (ctx, args) => {
    const { moduleId, ...updates } = args;
    await ctx.db.patch(moduleId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await ctx.db.get(moduleId);
  },
});

export const deleteCalculationModule = mutation({
  args: { moduleId: v.id("calculationModules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.moduleId);
    return args.moduleId;
  },
});

// Calculation module preset operations
export const getCalculationModulePresets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const presets = await ctx.db
      .query("calculationModulePresets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return presets.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },
});

export const createCalculationModulePreset = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    modules: v.any(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const presetId = await ctx.db.insert("calculationModulePresets", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(presetId);
  },
});

export const updateCalculationModulePreset = mutation({
  args: {
    presetId: v.id("calculationModulePresets"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    modules: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const preset = await ctx.db.get(args.presetId);
    if (!preset || preset.userId !== args.userId) {
      throw new Error("Preset not found");
    }

    const updates: any = { updatedAt: new Date().toISOString() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.modules !== undefined) updates.modules = args.modules;

    await ctx.db.patch(args.presetId, updates);
    return await ctx.db.get(args.presetId);
  },
});

export const deleteCalculationModulePreset = mutation({
  args: { presetId: v.id("calculationModulePresets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.presetId);
    return args.presetId;
  },
});

export const applyCalculationModulePreset = mutation({
  args: {
    userId: v.id("users"),
    presetId: v.id("calculationModulePresets"),
  },
  handler: async (ctx, args) => {
    const preset = await ctx.db.get(args.presetId);
    if (!preset || preset.userId !== args.userId) {
      throw new Error("Preset not found");
    }

    const existingModules = await ctx.db
      .query("calculationModules")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const calculationModule of existingModules) {
      await ctx.db.delete(calculationModule._id);
    }

    const savedModules = preset.modules as any[];
    const moduleByOutputKey = new Map(
      savedModules.map((savedModule) => [savedModule.output?.key, savedModule]),
    );

    const now = new Date().toISOString();
    for (const savedModule of savedModules) {
      const {
        _id,
        _creationTime,
        userId,
        createdAt,
        updatedAt,
        ...moduleData
      } = savedModule;

      const dependencies = (moduleData.dependencies || []).map((dependency: any) => {
        const dependencyModule = moduleByOutputKey.get(dependency.outputKey);
        return {
          moduleId: dependencyModule?.name || dependency.moduleId,
          outputKey: dependency.outputKey,
        };
      });

      await ctx.db.insert("calculationModules", {
        ...moduleData,
        dependencies,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.presetId, { updatedAt: now });
    return preset.modules.length;
  },
});

// Settings operations
export const getSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return settings;
  },
});

export const upsertSettings = mutation({
  args: {
    userId: v.id("users"),
    electricityRate: v.number(),
  },
  handler: async (ctx, args) => {
    const existingSettings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        electricityRate: args.electricityRate,
      });
      return existingSettings._id;
    } else {
      const settingsId = await ctx.db.insert("settings", {
        userId: args.userId,
        electricityRate: args.electricityRate,
      });
      return settingsId;
    }
  },
});

// Utility function to calculate electricity cost
export const calculateElectricityCost = mutation({
  args: {
    previousReading: v.number(),
    currentReading: v.number(),
    rate: v.number(),
  },
  handler: async (ctx, args) => {
    const unitsConsumed = args.currentReading - args.previousReading;
    const electricityCost = unitsConsumed * args.rate;
    return {
      unitsConsumed,
      electricityCost,
    };
  },
});
