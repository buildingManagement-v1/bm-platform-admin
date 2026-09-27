export type AdvertAudience = "all" | "owner" | "manager" | "tenant";

export interface LoginAdvert {
  id: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  audience: AdvertAudience;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  /** API path of the banner image */
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
