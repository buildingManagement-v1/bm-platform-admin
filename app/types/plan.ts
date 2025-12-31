export enum PlanStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface PlanFeatures {
  maxBuildings?: number;
  maxManagers?: number;
  maxUnits?: number;
}

export interface Plan {
  id: string;
  name: string;
  buildingPrice: number;
  managerPrice: number;
  features: PlanFeatures;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  buildingPrice: number;
  managerPrice: number;
  features: PlanFeatures;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  status?: PlanStatus;
}
