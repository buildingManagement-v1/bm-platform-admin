import type { Plan } from "./plan";

export type SubscriptionStatus = "active" | "cancelled" | "expired";

export type SubscriptionAction =
  | "created"
  | "upgraded"
  | "downgraded"
  | "renewed"
  | "cancelled";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  totalAmount: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  history?: SubscriptionHistory[];
  /** Owner, attached by the admin list endpoint */
  user?: { id: string; name: string; email: string; deletedAt: string | null } | null;
}

export interface SubscriptionHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  action: SubscriptionAction;
  oldPlanId: string | null;
  newPlanId: string;
  proratedAmount: string | null;
  notes: string | null;
  createdAt: string;
  oldPlan?: Plan;
  newPlan?: Plan;
}

export interface CreateSubscriptionDto {
  userId: string;
  planId: string;
  billingCycleStart: string;
}
