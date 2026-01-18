import { z } from "zod";

export const subscriptionSchema = z.object({
  userId: z.string().min(1, "User is required"),
  planId: z.string().min(1, "Plan is required"),
  billingCycleStart: z.string().min(1, "Billing cycle start is required"),
});

export type SubscriptionSchema = z.output<typeof subscriptionSchema>;
