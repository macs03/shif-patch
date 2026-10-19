import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import type { Shift } from "@/lib/domain/types";

const mockCreateClient = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

type Profile = { id: string; name: string; role: string; agency_id: string | null };

const nurse: Profile = {
  id: "nurse-1",
  name: "Maria Lopez",
  role: "nurse",
  agency_id: null,
};

function shiftRow(shift: Shift) {
  return {
    id: shift.id,
    agency_id: shift.agencyId,
    role: shift.role,
    date: shift.date,
    start_time: `${shift.startTime}:00`,
    end_time: `${shift.endTime}:00`,
    status: shift.status,
    claimed_by: shift.claimedBy,
    agencies: { name: shift.agencyName },
  };
}

function rpcShift(shift: Shift) {
  return {
    id: shift.id,
    agency_id: shift.agencyId,
    agency_name: shift.agencyName,
    role: shift.role,
    shift_date: shift.date,
    start_time: shift.startTime,
    end_time: shift.endTime,
    status: shift.status,
    claimed_by: shift.claimedBy,
  };
}

let profile: Profile | null = nurse;

function request(path: string, init: RequestInit = {}): Request {
  return new Request(`https://shiftpatch.test${path}`, init);
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("API route contracts", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    profile = nurse;
    mockSignInWithPassword.mockReset();
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockCreateClient.mockReset();
    mockCreateClient.mockImplementation((_url: string, _key: string, options: { accessToken?: () => Promise<string> }) => ({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        getUser: mockGetUser,
      },
      from: mockFrom,
      rpc: mockRpc,
      accessToken: options?.accessToken,
    }));
    mockGetUser.mockImplementation(async () => ({
      data: { user: { id: "auth-uuid", user_metadata: { role: "admin" } } },
      error: null,
    }));
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: profile, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          order: async () => ({ data: trialShifts.map(shiftRow), error: null }),
          eq: () => ({
            order: async () => ({
              data: trialShifts.filter((shift) => shift.agencyId === "agency-a").map(shiftRow),
              error: null,
            }),
          }),
        }),
      };
    });
    mockRpc.mockResolvedValue({ data: [rpcShift(trialShifts[0])], error: null });
  });

  it("logs in with the access token and ignores a spoofed metadata role", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: "access-jwt", refresh_token: "refresh-secret" } },
      error: null,
    });
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "maria.lopez@example.com", password: "secret-value" }),
      }),
    );
    const body = await bodyOf(response);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      token: "access-jwt",
      user: { id: "nurse-1", name: "Maria Lopez", role: "nurse" },
    });
    expect(JSON.stringify(body)).not.toContain("refresh-secret");
    expect(JSON.stringify(body)).not.toContain("secret-value");
    expect(mockGetUser).toHaveBeenCalledWith("access-jwt");
    for (const call of mockCreateClient.mock.calls) {
      expect(call[2].auth).toEqual({
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      });
    }
  });

  it("returns the packet 401 for an unknown email or wrong password", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" },
    });
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "missing@example.com", password: "wrong-password" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(await bodyOf(response)).toEqual({ error: "Invalid email or password" });
  });

  it("returns generic 429 when password login is throttled", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { status: 429, code: "over_request_rate_limit", message: "private provider details" },
    });
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maria.lopez@example.com", password: "Trial2026!" }),
    }));
    expect(response.status).toBe(429);
    expect(await bodyOf(response)).toEqual({ error: "Too many requests. Try again later." });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.has("retry-after")).toBe(false);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("rejects oversized JSON before login or shift mutation work", async () => {
    const { POST: login } = await import("@/app/api/auth/login/route");
    const { POST: create } = await import("@/app/api/shifts/route");
    const { POST: claim } = await import("@/app/api/shifts/[id]/claim/route");
    const { POST: cancel } = await import("@/app/api/shifts/[id]/cancel/route");
    const input = (path: string) => request(path, {
      method: "POST",
      headers: { authorization: "Bearer token" },
      body: " ".repeat(65_537),
    });
    const context = { params: Promise.resolve({ id: "shift-1" }) };
    for (const run of [
      () => login(input("/api/auth/login")),
      () => create(input("/api/shifts")),
      () => claim(input("/api/shifts/shift-1/claim"), context),
      () => cancel(input("/api/shifts/shift-1/cancel"), context),
    ]) {
      const response = await run();
      expect(response.status).toBe(413);
      expect(await bodyOf(response)).toEqual({ error: "Request body too large" });
    }
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a mapped login when the application profile is missing", async () => {
    profile = null;
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: "access-jwt", refresh_token: "refresh-secret" } },
      error: null,
    });
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "extra@example.com", password: "secret-value" }),
      }),
    );
    const body = await bodyOf(response);
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(JSON.stringify(body)).not.toContain("refresh-secret");
  });

  it("rejects missing, malformed and rejected bearer tokens before a mutation", async () => {
    const { POST } = await import("@/app/api/shifts/route");
    const missing = await POST(
      request("/api/shifts", { method: "POST", body: JSON.stringify({ role: "RN", date: "2026-10-16", startTime: "07:00", endTime: "19:00" }) }),
    );
    expect(missing.status).toBe(401);
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: "bad jwt" } });
    const rejected = await POST(
      request("/api/shifts", {
        method: "POST",
        headers: { authorization: "Bearer tampered" },
        body: JSON.stringify({ role: "RN", date: "2026-10-16", startTime: "07:00", endTime: "19:00" }),
      }),
    );
    const malformed = await POST(
      request("/api/shifts", {
        method: "POST",
        headers: { authorization: "Token tampered" },
        body: "{}",
      }),
    );
    expect(rejected.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("lists every baseline shift for a mapped caller and blocks other methods", async () => {
    const { GET, PUT } = await import("@/app/api/shifts/route");
    const response = await GET(request("/api/shifts", { headers: { authorization: "Bearer access-jwt" } }));
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toEqual({ shifts: trialShifts });
    expect(response.headers.get("cache-control")).toBe("no-store");
    const denied = PUT();
    expect(denied.status).toBe(405);
    expect(await bodyOf(denied)).toEqual({ error: "Method not allowed" });
  });

  it("lets only an agency create its own shift and ignores spoofed ownership", async () => {
    const { POST } = await import("@/app/api/shifts/route");
    const forbidden = await POST(
      request("/api/shifts", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({ role: "RN", date: "2026-10-16", startTime: "19:00", endTime: "07:00" }),
      }),
    );
    expect(forbidden.status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();

    profile = { id: "agency-a", name: "Sunrise Health Staffing", role: "agency", agency_id: "agency-a" };
    const spoofed = await POST(
      request("/api/shifts", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({
          role: "RN",
          date: "2026-10-16",
          startTime: "19:00",
          endTime: "07:00",
          agencyId: "agency-b",
        }),
      }),
    );
    expect(spoofed.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();

    const created = rpcShift({ ...trialShifts[0], id: "shift-new", status: "open", claimedBy: null });
    mockRpc.mockResolvedValue({ data: [created], error: null });
    const response = await POST(
      request("/api/shifts", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({ role: "RN", date: "2026-10-16", startTime: "19:00", endTime: "07:00" }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mockRpc).toHaveBeenCalledWith("create_shift", {
      p_role: "RN",
      p_date: "2026-10-16",
      p_start_time: "19:00",
      p_end_time: "07:00",
    });
    expect((await bodyOf(response)).claimedBy).toBeNull();
  });

  it("claims only for a nurse and maps credential, missing and filled failures", async () => {
    const { POST } = await import("@/app/api/shifts/[id]/claim/route");
    const context = { params: Promise.resolve({ id: "shift-1" }) };
    profile = { id: "agency-a", name: "Sunrise Health Staffing", role: "agency", agency_id: "agency-a" };
    const forbidden = await POST(
      request("/api/shifts/shift-1/claim", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: "",
      }),
      context,
    );
    expect(forbidden.status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();

    profile = nurse;
    const nonempty = await POST(
      request("/api/shifts/shift-1/claim", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({ nurseId: "admin-1" }),
      }),
      context,
    );
    expect(nonempty.status).toBe(400);

    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "shiftpatch_credential_expired", code: "P0001" } });
    const expired = await POST(
      request("/api/shifts/shift-1/claim", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: "{}",
      }),
      context,
    );
    expect(expired.status).toBe(403);
    expect(await bodyOf(expired)).toEqual({ error: "Credential expired, cannot claim shift" });

    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "shiftpatch_not_found", code: "P0001" } });
    const missing = await POST(
      request("/api/shifts/shift-1/claim", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: "{}",
      }),
      context,
    );
    expect(missing.status).toBe(404);

    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "shiftpatch_not_available", code: "P0001" } });
    const filled = await POST(
      request("/api/shifts/shift-1/claim", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: "{}",
      }),
      context,
    );
    expect(filled.status).toBe(409);
    expect(await bodyOf(filled)).toEqual({ error: "Shift is not available" });
  });

  it("cancels for a nurse or agency and keeps admin read-only", async () => {
    const { POST } = await import("@/app/api/shifts/[id]/cancel/route");
    const context = { params: Promise.resolve({ id: "shift-2" }) };
    profile = { id: "admin-1", name: "Alex Kim", role: "admin", agency_id: null };
    const forbidden = await POST(
      request("/api/shifts/shift-2/cancel", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({ reason: "no-show" }),
      }),
      context,
    );
    expect(forbidden.status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();

    profile = nurse;
    mockRpc.mockResolvedValue({
      data: [
        {
          ...rpcShift({ ...trialShifts[1], status: "open", claimedBy: null }),
          previous_nurse_id: "nurse-1",
          cancellation_reason: "advance",
        },
      ],
      error: null,
    });
    const response = await POST(
      request("/api/shifts/shift-2/cancel", {
        method: "POST",
        headers: { authorization: "Bearer access-jwt" },
        body: JSON.stringify({ reason: "advance" }),
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toMatchObject({
      status: "open",
      claimedBy: null,
      cancellation: { reason: "advance", previousNurseId: "nurse-1" },
    });
  });

  it("returns only the caller's agency shifts", async () => {
    const { GET } = await import("@/app/api/agencies/[agencyId]/shifts/route");
    const denied = await GET(request("/api/agencies/agency-a/shifts", { headers: { authorization: "Bearer access-jwt" } }), {
      params: Promise.resolve({ agencyId: "agency-a" }),
    });
    expect(denied.status).toBe(403);

    profile = { id: "agency-a", name: "Sunrise Health Staffing", role: "agency", agency_id: "agency-a" };
    const other = await GET(request("/api/agencies/agency-b/shifts", { headers: { authorization: "Bearer access-jwt" } }), {
      params: Promise.resolve({ agencyId: "agency-b" }),
    });
    expect(other.status).toBe(403);

    const response = await GET(request("/api/agencies/agency-a/shifts", { headers: { authorization: "Bearer access-jwt" } }), {
      params: Promise.resolve({ agencyId: "agency-a" }),
    });
    const body = await bodyOf(response);
    expect(response.status).toBe(200);
    expect(body.agencyId).toBe("agency-a");
    expect(body.shifts).toEqual(trialShifts.filter((shift) => shift.agencyId === "agency-a"));
  });
});
