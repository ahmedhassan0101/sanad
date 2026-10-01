// Unified service response: machine-readable code + Arabic display message.
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): Result<never> {
  return { ok: false, code, message };
}
