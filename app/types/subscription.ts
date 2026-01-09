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
  buildingCount: number;
  managerCount: number;
  totalAmount: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  history?: SubscriptionHistory[];
}

export interface SubscriptionHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  action: SubscriptionAction;
  oldPlanId: string | null;
  newPlanId: string;
  oldBuildingCount: number | null;
  newBuildingCount: number;
  oldManagerCount: number | null;
  newManagerCount: number;
  proratedAmount: string | null;
  notes: string | null;
  createdAt: string;
  oldPlan?: Plan;
  newPlan?: Plan;
}

export interface CreateSubscriptionDto {
  userId: string;
  planId: string;
  buildingCount: number;
  managerCount: number;
  billingCycleStart: string;
}
