import "server-only";

import { auditResponseSchema, shiftSchema } from "../domain/schemas";
import type { AuditEvent, CancellationReason, Shift, ShiftRole, ShiftStatus } from "../domain/types";
import { HttpError } from "./http";
import { createDataClient, supabaseConfig } from "./supabase";

const DB_ERRORS: Record<string, { status: number; error: string }> = {
  shiftpatch_forbidden: { status: 403, error: "Forbidden" },
  shiftpatch_not_found: { status: 404, error: "Shift not found" },
  shiftpatch_not_available: { status: 409, error: "Shift is not available" },
  shiftpatch_not_filled: { status: 409, error: "Shift is not filled" },
  shiftpatch_credential_expired: {
    status: 403,
    error: "Credential expired, cannot claim shift",
  },
  shiftpatch_invalid: { status: 400, error: "Invalid request" },
  shiftpatch_object_missing: { status: 500, error: "Internal server error" },
};

type AgencyEmbed = { name: string };
type ShiftRow = {
  id: string;
  agency_id: string;
  role: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  claimed_by: string | null;
  agencies: AgencyEmbed | AgencyEmbed[] | null;
};

type RpcShift = {
  id: string;
  agency_id: string;
  agency_name: string;
  role: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  claimed_by: string | null;
  previous_nurse_id?: string | null;
  cancellation_reason?: string | null;
};

function dataClient(token: string) {
  return createDataClient(supabaseConfig(), token);
}

function clock(value: string): string {
  const match = /^([01]\d|2[0-3]):[0-5]\d/.exec(value);
  if (!match) throw new HttpError(500, "Internal server error");
  return match[0];
}

function day(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(500, "Internal server error");
  return value;
}

function agencyName(agencies: ShiftRow["agencies"]): string {
  const agency = Array.isArray(agencies) ? agencies[0] : agencies;
  if (!agency?.name) throw new HttpError(500, "Internal server error");
  return agency.name;
}

function shiftRole(value: string): ShiftRole {
  if (value !== "RN" && value !== "LPN") throw new HttpError(500, "Internal server error");
  return value;
}

function shiftStatus(value: string): ShiftStatus {
  if (value !== "open" && value !== "filled") throw new HttpError(500, "Internal server error");
  return value;
}

function toShift(row: {
  id: string;
  agencyId: string;
  agencyName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  claimedBy: string | null;
}): Shift {
  const status = shiftStatus(row.status);
  if ((status === "open") !== (row.claimedBy === null)) throw new HttpError(500, "Internal server error");
  const parsed = shiftSchema.safeParse({
    ...row,
    role: shiftRole(row.role),
    date: day(row.date),
    startTime: clock(row.startTime),
    endTime: clock(row.endTime),
    status,
  });
  if (!parsed.success) throw new HttpError(500, "Internal server error");
  return parsed.data;
}

function fromListRow(shift: ShiftRow): Shift {
  return toShift({
    id: shift.id,
    agencyId: shift.agency_id,
    agencyName: agencyName(shift.agencies),
    role: shift.role,
    date: shift.date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    status: shift.status,
    claimedBy: shift.claimed_by,
  });
}

function fromRpc(row: RpcShift): Shift {
  return toShift({
    id: row.id,
    agencyId: row.agency_id,
    agencyName: row.agency_name,
    role: row.role,
    date: row.shift_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    claimedBy: row.claimed_by,
  });
}

function unavailableMessage(message: string): boolean {
  return /fetch failed|network|timeout|ECONN|ENOTFOUND|503/i.test(message);
}

export function throwDataError(error: { message?: string; code?: string }): never {
  const message = error.message?.trim() ?? "";
  const key = /shiftpatch_[a-z0-9_]+/.exec(message)?.[0];
  const mapped = key ? DB_ERRORS[key] : undefined;
  if (mapped) throw new HttpError(mapped.status, mapped.error);
  if (error.code === "42501") throw new HttpError(403, "Forbidden");
  if (error.code === "PGRST301" || error.code === "PGRST303") throw new HttpError(401, "Unauthorized");
  if (unavailableMessage(message)) throw new HttpError(503, "Service unavailable");
  throw new HttpError(500, "Internal server error");
}

function oneRpc(data: unknown): RpcShift {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new HttpError(500, "Internal server error");
  return row as RpcShift;
}

export async function readShifts(token: string): Promise<Shift[]> {
  const supabase = dataClient(token);
  let data: ShiftRow[] | null;
  let error: { message: string; code?: string } | null;
  try {
    const result = await supabase
      .from("shifts")
      .select("id, agency_id, role, date, start_time, end_time, status, claimed_by, agencies(name)")
      .order("id");
    data = result.data as ShiftRow[] | null;
    error = result.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (error || !data) throwDataError(error ?? {});
  return data.map(fromListRow);
}

export async function readAgencyShifts(token: string, agencyId: string): Promise<Shift[]> {
  const supabase = dataClient(token);
  let data: ShiftRow[] | null;
  let error: { message: string; code?: string } | null;
  try {
    const result = await supabase
      .from("shifts")
      .select("id, agency_id, role, date, start_time, end_time, status, claimed_by, agencies(name)")
      .eq("agency_id", agencyId)
      .order("id");
    data = result.data as ShiftRow[] | null;
    error = result.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (error || !data) throwDataError(error ?? {});
  return data.map(fromListRow);
}

async function callRpc(
  token: string,
  fn: "create_shift" | "claim_shift" | "cancel_shift",
  args: Record<string, string>,
): Promise<RpcShift> {
  const supabase = dataClient(token);
  let data: unknown;
  let error: { message: string; code?: string } | null;
  try {
    const result = await supabase.rpc(fn, args);
    data = result.data;
    error = result.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (error) throwDataError(error);
  return oneRpc(data);
}

export async function createShift(
  token: string,
  input: { role: ShiftRole; date: string; startTime: string; endTime: string },
): Promise<Shift> {
  const row = await callRpc(token, "create_shift", {
    p_role: input.role,
    p_date: input.date,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
  });
  return fromRpc(row);
}

export async function claimShift(token: string, id: string): Promise<Shift> {
  return fromRpc(await callRpc(token, "claim_shift", { p_id: id }));
}

export async function readAuditEvents(token: string): Promise<AuditEvent[]> {
  const supabase = dataClient(token);
  let data: unknown;
  let error: { message: string; code?: string } | null;
  try {
    const result = await supabase.rpc("read_audit_events");
    data = result.data;
    error = result.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (error) throwDataError(error);
  const rows = Array.isArray(data) ? data : [];
  return auditResponseSchema.parse({
    events: rows.map((row) => {
      const event = row as {
        id: string;
        actor_id: string;
        shift_id: string;
        action: string;
        occurred_at: string | Date;
        reason: string | null;
        previous_nurse_id: string | null;
      };
      return {
        id: event.id,
        actorId: event.actor_id,
        shiftId: event.shift_id,
        action: event.action,
        occurredAt: event.occurred_at instanceof Date ? event.occurred_at.toISOString() : event.occurred_at,
        reason: event.reason,
        previousNurseId: event.previous_nurse_id,
      };
    }),
  }).events;
}

export async function cancelShift(
  token: string,
  id: string,
  reason: CancellationReason,
): Promise<Shift & { cancellation: { reason: CancellationReason; previousNurseId: string } }> {
  const row = await callRpc(token, "cancel_shift", { p_id: id, p_reason: reason });
  const shift = fromRpc(row);
  if (shift.status !== "open" || shift.claimedBy !== null || !row.previous_nurse_id) {
    throw new HttpError(500, "Internal server error");
  }
  if (row.cancellation_reason !== "no-show" && row.cancellation_reason !== "advance") {
    throw new HttpError(500, "Internal server error");
  }
  return {
    ...shift,
    cancellation: { reason: row.cancellation_reason, previousNurseId: row.previous_nurse_id },
  };
}
