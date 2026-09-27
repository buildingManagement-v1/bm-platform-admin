import { z } from "zod";

/** Mirrors CreateSubscriptionDto */
export const subscriptionSchema = z.object({
  userId: z.string().uuid("Select an owner"),
  planId: z.string().uuid("Select a plan"),
  billingCycleStart: z.string().min(1, "Billing cycle start is required"),
  durationMonths: z.coerce.number().int().min(1).max(36),
  notes: z.string().max(500).optional(),
});

export type SubscriptionSchema = z.output<typeof subscriptionSchema>;

/** Mirrors ExtendSubscriptionDto */
export const extendSubscriptionSchema = z.object({
  months: z.coerce.number().int().min(1, "At least 1 month").max(36),
  reason: z.string().min(1, "Give a reason").max(500),
});

export type ExtendSubscriptionSchema = z.output<typeof extendSubscriptionSchema>;
