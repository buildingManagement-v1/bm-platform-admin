export type UserStatus = 'active' | 'inactive';

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface ManagerBuilding {
  id: string;
  name: string;
  roles: string[];
}

export interface PlatformManager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
  ownerId: string;
  buildingCount: number;
  buildings: ManagerBuilding[];
}

export interface PlatformTenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
  buildingId: string;
  buildingName: string;
  buildingCity: string | null;
}

export interface PaginatedUsersResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
