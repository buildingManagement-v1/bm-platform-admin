export type SubscriptionRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

/** Owner plan request paid by bank transfer, reviewed by billing admins */
export interface SubscriptionRequest {
  id: string;
  userId: string;
  planId: string;
  amount: string;
  receiptUrl: string;
  paymentReference: string | null;
  notes: string | null;
  status: SubscriptionRequestStatus;
  reviewedAt: string | null;
  reviewedById: string | null;
  rejectionReason: string | null;
  subscriptionId: string | null;
  createdAt: string;
  plan: { id: string; name: string; price: string };
  owner: { id: string; name: string; email: string } | null;
}
