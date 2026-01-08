export enum ActivityAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  STATUS_CHANGE = "status_change",
}

export enum ActivityEntityType {
  SUBSCRIPTION_PLAN = "subscription_plan",
  PLATFORM_ADMIN = "platform_admin",
}

export interface PlatformActivityLog {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  adminId: string;
  adminName: string;
  details: Record<string, any> | null;
  createdAt: string;
}
