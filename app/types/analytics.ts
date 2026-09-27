export interface AnalyticsOverview {
  owners: {
    total: number;
    active: number;
    inactive: number;
    pendingDeletion: number;
    withActivePlan: number;
    withoutActivePlan: number;
    newThisMonth: number;
  };
  portfolio: {
    buildings: number;
    units: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    activeTenants: number;
    activeManagers: number;
    rentCollectedThisMonth: number;
  };
  subscriptions: {
    active: number;
    trials: number;
    paid: number;
    planMix: Array<{ plan: string; owners: number }>;
    /** Annual recurring revenue from active paid plans (ETB) */
    arr: number;
    mrr: number;
    pendingRequests: number;
    billedThisMonth: number;
  };
  trends: Array<{ month: string; signups: number; billed: number }>;
}
