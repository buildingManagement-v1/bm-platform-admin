export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}

export interface PageInfo {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_previous: boolean;
  has_next: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: { page_info: PageInfo };
}

export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
