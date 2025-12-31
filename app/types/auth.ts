export interface Admin {
  id: string;
  name: string;
  email: string;
  roles: AdminRole[];
  status: "active" | "inactive";
  mustResetPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  mustResetPassword: boolean;
  roles?: string[];
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

export type User = Admin | Manager;

export type UserType = "admin" | "manager";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin?: Admin;
  manager?: Manager;
}
