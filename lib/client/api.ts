import {
  adminDashboardResponseSchema,
  agencyShiftsResponseSchema,
  apiErrorSchema,
  auditResponseSchema,
  cancelShiftResponseSchema,
  credentialResponseSchema,
  loginResponseSchema,
  shiftSchema,
  shiftsResponseSchema,
} from "@/lib/domain/schemas";
import type {
  AdminDashboardResponse,
  AuditEvent,
  CancellationReason,
  CreateShiftRequest,
  CredentialResponse,
  SessionUser,
  Shift,
} from "@/lib/domain/types";

export class ApiError extends Error {
  readonly status: number;
  readonly uncertain: boolean;

  constructor(status: number, message: string, uncertain = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.uncertain = uncertain;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function send(
  path: string,
  token: string | null,
  init: RequestInit,
  jsonBody = true,
): Promise<Response> {
  try {
    return await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        ...(jsonBody && init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: init.signal,
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError(0, "The service could not be reached.", true);
  }
}

async function read<T>(response: Response, parse: (body: unknown) => T, mutation: boolean): Promise<T> {
  if (!response.ok) {
    let message = "The request failed.";
    try {
      const parsed = apiErrorSchema.safeParse(await response.json());
      if (parsed.success) message = parsed.data.error;
    } catch (error) {
      if (isAbort(error)) throw error;
      message = "The request failed.";
    }
    throw new ApiError(response.status, message, mutation && response.status >= 500);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError(response.status, "The request failed.", mutation);
  }
  try {
    return parse(body);
  } catch {
    throw new ApiError(response.status, "The request failed.", mutation);
  }
}

export async function login(email: string, password: string, signal?: AbortSignal): Promise<{
  token: string;
  user: SessionUser;
}> {
  const response = await send("/api/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    signal,
  });
  return read(response, (body) => loginResponseSchema.parse(body), false);
}

export async function listMarketplace(token: string, signal?: AbortSignal): Promise<Shift[]> {
  const response = await send("/api/shifts", token, { method: "GET", signal });
  return read(response, (body) => shiftsResponseSchema.parse(body).shifts, false);
}

export async function listAgency(token: string, agencyId: string, signal?: AbortSignal): Promise<Shift[]> {
  const response = await send(`/api/agencies/${encodeURIComponent(agencyId)}/shifts`, token, {
    method: "GET",
    signal,
  });
  return read(response, (body) => agencyShiftsResponseSchema.parse(body).shifts, false);
}

export async function createShift(
  token: string,
  body: CreateShiftRequest,
  signal?: AbortSignal,
): Promise<Shift> {
  const response = await send("/api/shifts", token, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  return read(response, (payload) => shiftSchema.parse(payload), true);
}

export async function claimShift(token: string, shiftId: string, signal?: AbortSignal): Promise<Shift> {
  const response = await send(`/api/shifts/${encodeURIComponent(shiftId)}/claim`, token, {
    method: "POST",
    body: "{}",
    signal,
  });
  return read(response, (payload) => shiftSchema.parse(payload), true);
}

export async function readCredential(token: string, signal?: AbortSignal): Promise<CredentialResponse> {
  const response = await send("/api/credentials", token, { method: "GET", signal });
  return read(response, (body) => credentialResponseSchema.parse(body), false);
}

export async function submitCredential(
  token: string,
  document: File,
  expiresOn: string,
  signal?: AbortSignal,
): Promise<CredentialResponse> {
  const body = new FormData();
  body.set("document", document);
  body.set("expiresOn", expiresOn);
  const response = await send("/api/credentials", token, { method: "POST", body, signal }, false);
  return read(response, (payload) => credentialResponseSchema.parse(payload), true);
}

export async function readAdminDashboard(token: string, signal?: AbortSignal): Promise<AdminDashboardResponse> {
  const response = await send("/api/admin/dashboard", token, { method: "GET", signal });
  return read(response, (body) => adminDashboardResponseSchema.parse(body), false);
}

export async function readAudit(token: string, signal?: AbortSignal): Promise<AuditEvent[]> {
  const response = await send("/api/admin/audit", token, { method: "GET", signal });
  return read(response, (body) => auditResponseSchema.parse(body).events, false);
}

export async function cancelShift(
  token: string,
  shiftId: string,
  reason: CancellationReason,
  signal?: AbortSignal,
): Promise<Shift> {
  const response = await send(`/api/shifts/${encodeURIComponent(shiftId)}/cancel`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
    signal,
  });
  return read(response, (payload) => {
    const parsed = cancelShiftResponseSchema.parse(payload);
    return shiftSchema.parse(parsed);
  }, true);
}
