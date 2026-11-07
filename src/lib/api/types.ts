/**
 * The Carrivo API response envelope. Every endpoint uses it except Better Auth's
 * /auth/change-password (see docs/API_CONTRACT.md).
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  /** e.g. "body.email", "query.sortBy", "image", or "" for non-field errors. */
  path: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  /** Present on list endpoints. */
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** A list response with its pagination, as the UI consumes it. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
