import "server-only";

import type { UserRole } from "../domain/types";
import { sessionUserSchema } from "../domain/schemas";
import { HttpError } from "./http";
import { createAuthClient, createDataClient, supabaseConfig } from "./supabase";

export type Caller = {
  token: string;
  authUserId: string;
  id: string;
  name: string;
  role: UserRole;
  agencyId: string | null;
};

type AuthFailure = { status?: number; code?: string; name?: string };

function unavailable(error: AuthFailure): boolean {
  return error.name === "AuthRetryableFetchError" || error.status === 0 || (error.status ?? 0) >= 500;
}

function loginFailure(error: AuthFailure): HttpError {
  if (unavailable(error)) return new HttpError(503, "Service unavailable");
  if (
    error.code === "invalid_credentials" ||
    error.code === "user_not_found" ||
    error.code === "email_not_confirmed" ||
    error.status === 400 ||
    error.status === 401
  ) {
    return new HttpError(401, "Invalid email or password");
  }
  return new HttpError(500, "Internal server error");
}

export async function loadCaller(token: string): Promise<Caller | null> {
  const config = supabaseConfig();
  const auth = createAuthClient(config);
  let userId: string;
  try {
    const result = await auth.auth.getUser(token);
    if (result.error || !result.data.user) {
      if (result.error && unavailable(result.error)) throw new HttpError(503, "Service unavailable");
      throw new HttpError(401, "Unauthorized");
    }
    userId = result.data.user.id;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Service unavailable");
  }

  const data = createDataClient(config, token);
  let row: { id: string; name: string; role: string; agency_id: string | null } | null;
  try {
    const result = await data
      .from("users")
      .select("id, name, role, agency_id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (result.error) {
      if (unavailable(result.error)) throw new HttpError(503, "Service unavailable");
      throw new HttpError(500, "Internal server error");
    }
    row = result.data;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Service unavailable");
  }
  if (!row) return null;
  const parsed = sessionUserSchema.safeParse({ id: row.id, name: row.name, role: row.role });
  if (!parsed.success) throw new HttpError(500, "Internal server error");
  return { token, authUserId: userId, ...parsed.data, agencyId: row.agency_id };
}

export function bearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  const match = header ? /^Bearer (\S+)$/i.exec(header) : null;
  if (!match) throw new HttpError(401, "Unauthorized");
  return match[1];
}

export async function requireCaller(request: Request): Promise<Caller> {
  const token = bearerToken(request);
  const caller = await loadCaller(token);
  if (!caller) throw new HttpError(403, "Forbidden");
  return caller;
}

export async function login(email: string, password: string): Promise<{
  token: string;
  user: { id: string; name: string; role: UserRole };
}> {
  const config = supabaseConfig();
  const auth = createAuthClient(config);
  let token: string;
  try {
    const result = await auth.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.session?.access_token) throw loginFailure(result.error ?? {});
    token = result.data.session.access_token;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Service unavailable");
  }
  const caller = await loadCaller(token);
  if (!caller) throw new HttpError(403, "Forbidden");
  return { token, user: { id: caller.id, name: caller.name, role: caller.role } };
}
