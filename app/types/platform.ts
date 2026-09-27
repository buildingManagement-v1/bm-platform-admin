export interface PlatformSetting {
  key: string;
  label: string;
  description: string;
  maxLength: number;
  value: string;
  isDefault: boolean;
  canEdit: boolean;
  updatedAt: string | null;
}

export type BroadcastAudience = "owners" | "managers" | "tenants" | "everyone";

export interface Broadcast {
  id: string;
  sentAt: string;
  sentBy: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  link: string | null;
  recipients: number;
}
