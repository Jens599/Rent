import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "../lib/logger";

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
