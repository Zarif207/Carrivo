import type { ApiErrorDetail } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toDetails = (value: unknown): ApiErrorDetail[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): ApiErrorDetail[] =>
    isRecord(item) && typeof item.message === "string"
      ? [{ path: typeof item.path === "string" ? item.path : "", message: item.message }]
      : [],
  );
};

/** Strips the validator's location prefix: "body.weightLb" → "weightLb", "query.sortBy" → "sortBy". */
const toFieldName = (path: string): string => path.replace(/^(body|query|params)\.?/, "");

/**
 * The single error type for every failed API call (server helper, BFF proxy and client fetchers).
 * `status` is the HTTP status; 0 means the request never got a response (network error or timeout).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiErrorDetail[];

  constructor(status: number, message: string, errors: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Builds an ApiError from a parsed error body (our envelope, Better Auth's `{ message }`, or anything else). */
  static fromBody(status: number, body: unknown, fallbackMessage = "Something went wrong. Please try again."): ApiError {
    if (isRecord(body)) {
      const message = typeof body.message === "string" && body.message.trim() ? body.message : fallbackMessage;
      return new ApiError(status, message, toDetails(body.errors));
    }
    return new ApiError(status, fallbackMessage);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /** No/invalid/expired token, or the account was deactivated. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Wrong role (or own role/status change). */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Unknown id, or a resource that is not yours (the API never reveals which). */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** State-machine violations, duplicates, "in use", concurrent updates. */
  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Field errors keyed by form field name, for React Hook Form's `setError`.
   * Nested paths keep their dots ("courierProfile.hubId"). Non-field errors are skipped.
   */
  fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const { path, message } of this.errors) {
      const name = toFieldName(path);
      if (name && !(name in fields)) fields[name] = message;
    }
    return fields;
  }
}
