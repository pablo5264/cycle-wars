import { HttpError } from "./http.ts";

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${field} is required.`);
  }

  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Optional string field must be a string.");
  }

  return value;
}

export function assertNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}.`);
  }

  return value;
}

export function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `${field} must be an ISO date.`);
  }

  return value;
}

export function assertDate(value: unknown, field: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `${field} must be an ISO date.`);
  }

  return value;
}
