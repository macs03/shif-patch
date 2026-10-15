import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import { GET as getAudit } from "@/app/api/admin/audit/route";
import { GET as getDashboard } from "@/app/api/admin/dashboard/route";
import { GET as getCredential, POST as postCredential } from "@/app/api/credentials/route";
import {
  bogotaToday,
  deriveCredentialStatus,
  formatScheduledDuration,
  inspectDocument,
  scheduledMinutes,
} from "@/lib/domain/credentials";

const mockCreateClient = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockUpload = jest.fn();
const mockRemove = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

type Profile = { id: string; name: string; role: string; agency_id: string | null };

const nurse: Profile = { id: "nurse-1", name: "Maria Lopez", role: "nurse", agency_id: null };
const admin: Profile = { id: "admin-1", name: "Alex Kim", role: "admin", agency_id: null };

function shiftRow(shift: (typeof trialShifts)[number]) {
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

let profile: Profile | null = nurse;

function request(path: string, init: RequestInit = {}): Request {
  const draft = new Request(`https://shiftpatch.test${path}`, init);
  const headers = new Headers(draft.headers);
  if (!headers.has("authorization")) headers.set("authorization", "Bearer token");
  return new Request(draft, { headers });
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("credential status and scheduled duration", () => {
  it("keeps a credential valid through the Bogota calendar day", () => {
    expect(bogotaToday(new Date("2026-10-16T02:00:00.000Z"))).toBe("2026-10-15");
    expect(bogotaToday(new Date("2026-10-16T05:00:00.000Z"))).toBe("2026-10-16");
    expect(deriveCredentialStatus("2026-10-15", "2026-10-15")).toBe("valid");
    expect(deriveCredentialStatus("2026-10-15", "2026-10-16")).toBe("expired");
    expect(deriveCredentialStatus(null, "2026-10-15")).toBe("missing");
  });

  it("counts overnight scheduled hours without treating them as worked time", () => {
    expect(scheduledMinutes("19:00", "07:00")).toBe(12 * 60);
    expect(formatScheduledDuration("19:00", "07:00")).toBe("12h");
    expect(formatScheduledDuration("07:00", "19:30")).toBe("12h 30m");
  });

  it("accepts a matching pdf and rejects empty, oversize and mismatched files", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    expect(inspectDocument({ filename: "license.pdf", declaredType: "application/pdf", bytes: pdf })).toEqual({
      ok: true,
      filename: "license.pdf",
      mimeType: "application/pdf",
    });
    expect(inspectDocument({ filename: "license.pdf", declaredType: "application/pdf", bytes: new Uint8Array() }).ok).toBe(false);
    expect(inspectDocument({
      filename: "license.pdf",
      declaredType: "application/pdf",
      bytes: new Uint8Array(2 * 1024 * 1024 + 1),
    })).toMatchObject({ ok: false, issue: "oversize" });
    expect(inspectDocument({ filename: "license.pdf", declaredType: "image/png", bytes: pdf })).toMatchObject({
      ok: false,
      issue: "unsupported",
    });
    expect(inspectDocument({ filename: "notes.txt", declaredType: "text/plain", bytes: pdf })).toMatchObject({
      ok: false,
      issue: "unsupported",
    });
  });
});

describe("credential and admin routes", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    profile = nurse;
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockUpload.mockReset();
    mockRemove.mockReset();
    mockCreateClient.mockReset();
    mockCreateClient.mockImplementation(() => ({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
      storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) },
    }));
    mockGetUser.mockResolvedValue({ data: { user: { id: "11111111-1111-4111-8111-111111111111" } }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) };
      }
      return {
        select: () => ({
          order: async () => ({ data: trialShifts.map(shiftRow), error: null }),
        }),
      };
    });
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  it("returns the nurse credential and rejects other roles", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{
        expires_on: "2027-01-01",
        document_name: null,
        mime_type: null,
        size_bytes: null,
        uploaded_at: null,
        object_path: null,
      }],
      error: null,
    });
    const ok = await getCredential(request("/api/credentials"));
    expect(ok.status).toBe(200);
    const payload = await bodyOf(ok);
    expect(payload).toEqual({
      credential: {
        expiresOn: "2027-01-01",
        documentName: null,
        mimeType: null,
        sizeBytes: null,
        uploadedAt: null,
      },
      status: "valid",
    });
    expect(JSON.stringify(payload)).not.toContain("object_path");

    profile = admin;
    const denied = await getCredential(request("/api/credentials"));
    expect(denied.status).toBe(403);

    const anon = await getCredential(new Request("https://shiftpatch.test/api/credentials"));
    expect(anon.status).toBe(401);
  });

  it("rejects a bad upload and persists a valid one without a caller-selected nurse", async () => {
    const bad = new FormData();
    bad.set("document", new File([new Uint8Array([1, 2, 3])], "license.pdf", { type: "application/pdf" }));
    bad.set("expiresOn", "2027-01-01");
    const rejected = await postCredential(request("/api/credentials", { method: "POST", body: bad }));
    expect(rejected.status).toBe(415);
    expect(mockUpload).not.toHaveBeenCalled();

    const good = new FormData();
    good.set("document", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "license.pdf", { type: "application/pdf" }));
    good.set("expiresOn", "2020-01-02");
    mockRpc.mockImplementation((fn: string, args?: { p_object_path?: string }) => {
      if (fn !== "finalize_credential") return Promise.resolve({ data: null, error: { message: "unexpected" } });
      return Promise.resolve({
        data: [{
          expires_on: "2020-01-02",
          document_name: "license.pdf",
          mime_type: "application/pdf",
          size_bytes: 5,
          uploaded_at: "2026-10-15T12:00:00.000Z",
          object_path: args?.p_object_path,
          previous_object_path: null,
        }],
        error: null,
      });
    });
    const saved = await postCredential(request("/api/credentials", { method: "POST", body: good }));
    expect(saved.status).toBe(200);
    const payload = await bodyOf(saved);
    expect(payload.status).toBe("expired");
    expect(payload).not.toHaveProperty("objectPath");
    expect(mockRpc).toHaveBeenCalledWith("finalize_credential", expect.objectContaining({
      p_expires_on: "2020-01-02",
      p_document_name: "license.pdf",
      p_mime_type: "application/pdf",
      p_size_bytes: 5,
    }));
    const args = mockRpc.mock.calls[0]?.[1] as { p_object_path: string };
    expect(args.p_object_path.startsWith("11111111-1111-4111-8111-111111111111/")).toBe(true);
    expect(args.p_object_path).not.toContain("license.pdf");
  });

  it("keeps the previous credential when finalization fails and the new object can be removed", async () => {
    const good = new FormData();
    good.set("document", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "license.pdf", { type: "application/pdf" }));
    good.set("expiresOn", "2027-02-02");
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: "shiftpatch_invalid", code: "P0001" } })
      .mockResolvedValueOnce({
        data: [{
          expires_on: "2027-01-01",
          document_name: null,
          mime_type: null,
          size_bytes: null,
          uploaded_at: null,
          object_path: null,
        }],
        error: null,
      });
    const failed = await postCredential(request("/api/credentials", { method: "POST", body: good }));
    expect(failed.status).toBe(400);
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("returns both agencies with metrics from the same snapshot and hides it from nurses", async () => {
    profile = admin;
    const ok = await getDashboard(request("/api/admin/dashboard"));
    expect(ok.status).toBe(200);
    const payload = await bodyOf(ok);
    expect(payload.metrics).toEqual({ open: 2, filled: 1 });
    expect((payload.shifts as unknown[]).length).toBe(3);

    profile = nurse;
    const denied = await getDashboard(request("/api/admin/dashboard"));
    expect(denied.status).toBe(403);
    const anon = await getDashboard(new Request("https://shiftpatch.test/api/admin/dashboard"));
    expect(anon.status).toBe(401);
  });

  it("returns the admin audit log and denies a nurse", async () => {
    profile = admin;
    mockRpc.mockResolvedValueOnce({
      data: [{
        id: "55555555-5555-4555-8555-555555555555",
        actor_id: "agency-a",
        shift_id: "shift-9",
        action: "create",
        occurred_at: "2026-10-15T12:00:00.000Z",
        reason: null,
        previous_nurse_id: null,
      }],
      error: null,
    });
    const ok = await getAudit(request("/api/admin/audit"));
    expect(ok.status).toBe(200);
    expect(await bodyOf(ok)).toEqual({
      events: [{
        id: "55555555-5555-4555-8555-555555555555",
        actorId: "agency-a",
        shiftId: "shift-9",
        action: "create",
        occurredAt: "2026-10-15T12:00:00.000Z",
        reason: null,
        previousNurseId: null,
      }],
    });

    profile = nurse;
    const denied = await getAudit(request("/api/admin/audit"));
    expect(denied.status).toBe(403);
  });
});
