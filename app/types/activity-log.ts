export enum ActivityAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  STATUS_CHANGE = "status_change",
}

export enum ActivityEntityType {
  USER = "user",
  MANAGER = "manager",
  TENANT = "tenant",
  SUBSCRIPTION_PLAN = "subscription_plan",
  SUBSCRIPTION = "subscription",
  SUBSCRIPTION_REQUEST = "subscription_request",
  PLATFORM_ADMIN = "platform_admin",
  PLATFORM_SETTING = "platform_setting",
  LOGIN_ADVERT = "login_advert",
  BROADCAST = "broadcast",
  APP_VERSION_CONFIG = "app_version_config",
}

export interface PlatformActivityLog {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  adminId: string;
  adminName: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
