export enum PlanStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum PlanType {
  PUBLIC = "public",
  CUSTOM = "custom",
}

export interface PlanFeatures {
  maxBuildings: number;
  maxUnits: number;
  maxManagers: number;
  premiumFeatures: string[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: PlanFeatures;
  status: PlanStatus;
  type: PlanType;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  price: number;
  features: PlanFeatures;
  type: PlanType;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  status?: PlanStatus;
}
