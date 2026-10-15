import "server-only";

import { createClient } from "@supabase/supabase-js";

import { shiftSchema } from "../domain/schemas";
import type { Shift, ShiftRole, ShiftStatus } from "../domain/types";

const CONFIGURATION_ERROR = "Supabase server configuration is invalid";
const READ_ERROR = "Shift read failed";

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

function createServerClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: "shiftpatch", timeout: 10_000, retry: false },
  });
}

let client: ReturnType<typeof createServerClient> | undefined;

function failConfig(): never {
  throw new Error(CONFIGURATION_ERROR);
}

function serverConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key || /\s/.test(url) || /\s/.test(key)) failConfig();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    failConfig();
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !parsed.hostname) {
    failConfig();
  }
  return { url: parsed.origin, key };
}

function getSupabase(): ReturnType<typeof createServerClient> {
  if (client) return client;
  const { url, key } = serverConfig();
  client = createServerClient(url, key);
  return client;
}

function clock(value: string): string {
  const match = /^([01]\d|2[0-3]):[0-5]\d/.exec(value);
  if (!match) throw new Error(READ_ERROR);
  return match[0];
}

function day(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(READ_ERROR);
  return value;
}

function agencyName(agencies: ShiftRow["agencies"]): string {
  const agency = Array.isArray(agencies) ? agencies[0] : agencies;
  if (!agency?.name) throw new Error(READ_ERROR);
  return agency.name;
}

function shiftRole(value: string): ShiftRole {
  if (value !== "RN" && value !== "LPN") throw new Error(READ_ERROR);
  return value;
}

function shiftStatus(value: string): ShiftStatus {
  if (value !== "open" && value !== "filled") throw new Error(READ_ERROR);
  return value;
}

export async function readShifts(): Promise<Shift[]> {
  const supabase = getSupabase();
  let data: ShiftRow[] | null;
  let error: { message: string } | null;
  try {
    const result = await supabase
      .from("shifts")
      .select(
        "id, agency_id, role, date, start_time, end_time, status, claimed_by, agencies(name)",
      )
      .order("id");
    data = result.data as ShiftRow[] | null;
    error = result.error;
  } catch {
    throw new Error(READ_ERROR);
  }
  if (error || !data) throw new Error(READ_ERROR);
  return data.map((shift) => {
    const status = shiftStatus(shift.status);
    const claimedBy = shift.claimed_by;
    if ((status === "open") !== (claimedBy === null)) throw new Error(READ_ERROR);
    const mapped = {
      id: shift.id,
      agencyId: shift.agency_id,
      agencyName: agencyName(shift.agencies),
      role: shiftRole(shift.role),
      date: day(shift.date),
      startTime: clock(shift.start_time),
      endTime: clock(shift.end_time),
      status,
      claimedBy,
    };
    const parsed = shiftSchema.safeParse(mapped);
    if (!parsed.success) throw new Error(READ_ERROR);
    return parsed.data;
  });
}
