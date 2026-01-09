import { z } from "zod";

export const subscriptionSchema = z.object({
  userId: z.string().min(1, "User is required"),
  planId: z.string().min(1, "Plan is required"),
  buildingCount: z.number().min(1, "Building count must be at least 1"),
  managerCount: z.number().min(0, "Manager count must be 0 or more"),
  billingCycleStart: z.string().min(1, "Billing cycle start is required"),
});

export type SubscriptionSchema = z.output<typeof subscriptionSchema>;
