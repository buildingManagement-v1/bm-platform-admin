export interface Admin {
  id: string;
  name: string;
  email: string;
  roles: AdminRole[];
  status: "active" | "inactive";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  USER_MANAGER = "user_manager",
  ANALYTICS_VIEWER = "analytics_viewer",
  SYSTEM_MANAGER = "system_manager",
  BILLING_MANAGER = "billing_manager",
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}
