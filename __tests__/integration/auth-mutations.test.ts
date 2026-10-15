import { spawnSync } from "node:child_process";

import { loadEnvLocal } from "@/__tests__/setup/load-env-local";
import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import type { Shift } from "@/lib/domain/types";

loadEnvLocal();

const enabled = Boolean(
  process.env.SUPABASE_URL?.trim() &&
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() &&
    process.env.DB_PASSWORD?.trim() &&
    process.env.SHIFT_PATCH_HOSTED_MUTATIONS === "1",
);

const password = "Trial2026!";
const created: string[] = [];

function endpoint(path: string, init: RequestInit = {}): Request {
  return new Request(`https://shiftpatch.test${path}`, init);
}

async function login(email: string): Promise<{ token: string; id: string; role: string }> {
  const { POST } = await import("@/app/api/auth/login/route");
  const response = await POST(
    endpoint("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  );
  const body = (await response.json()) as { token: string; user: { id: string; role: string } };
  expect(response.status).toBe(200);
  return { token: body.token, id: body.user.id, role: body.user.role };
}

function auth(token: string): HeadersInit {
  return { authorization: `Bearer ${token}` };
}

function deleteCreated(): void {
  const ids = created.filter((id) => /^shift-[a-z0-9]+$/.test(id) && !["shift-1", "shift-2", "shift-3"].includes(id));
  if (ids.length === 0) return;
  const ref = new URL(process.env.SUPABASE_URL ?? "").hostname.split(".")[0];
  const list = ids.map((id) => `'${id}'`).join(", ");
  const result = spawnSync(
    "psql",
    [
      "-h",
      "aws-1-ca-central-1.pooler.supabase.com",
      "-p",
      "5432",
      "-U",
      `postgres.${ref}`,
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `DELETE FROM shiftpatch.shifts WHERE id IN (${list})`,
    ],
    {
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD, PGSSLMODE: "require" },
      encoding: "utf8",
      timeout: 20_000,
    },
  );
  if (result.status !== 0) {
    throw new Error("test shift cleanup failed");
  }
}

describe("hosted shift mutations", () => {
  jest.setTimeout(40_000);
  const testFn = enabled ? it : it.skip;

  afterAll(() => {
    if (enabled) deleteCreated();
  });

  testFn("enforces the six contracts, ownership and a single concurrent claim", async () => {
    const agencyA = await login("admin@sunrisehealth.example");
    const agencyB = await login("admin@metrocare.example");
    const nurse1 = await login("maria.lopez@example.com");
    const nurse2 = await login("james.cook@example.com");
    const admin = await login("alex.kim@example.com");

    const { GET: listShifts, POST: createShift } = await import("@/app/api/shifts/route");
    const { POST: claim } = await import("@/app/api/shifts/[id]/claim/route");
    const { POST: cancel } = await import("@/app/api/shifts/[id]/cancel/route");
    const { GET: agencyList } = await import("@/app/api/agencies/[agencyId]/shifts/route");

    const badToken = await listShifts(endpoint("/api/shifts", { headers: auth(`${admin.token}tampered`) }));
    expect(badToken.status).toBe(401);
    expect(await badToken.json()).toEqual({ error: "Unauthorized" });

    for (const token of [agencyA.token, agencyB.token, nurse1.token, nurse2.token, admin.token]) {
      const response = await listShifts(endpoint("/api/shifts", { headers: auth(token) }));
      const body = (await response.json()) as { shifts: Shift[] };
      expect(response.status).toBe(200);
      expect(body.shifts).toEqual(expect.arrayContaining(trialShifts));
    }

    const ownA = await agencyList(endpoint("/api/agencies/agency-a/shifts", { headers: auth(agencyA.token) }), {
      params: Promise.resolve({ agencyId: "agency-a" }),
    });
    const ownB = await agencyList(endpoint("/api/agencies/agency-b/shifts", { headers: auth(agencyB.token) }), {
      params: Promise.resolve({ agencyId: "agency-b" }),
    });
    const cross = await agencyList(endpoint("/api/agencies/agency-a/shifts", { headers: auth(agencyB.token) }), {
      params: Promise.resolve({ agencyId: "agency-a" }),
    });
    const nurseAgency = await agencyList(endpoint("/api/agencies/agency-a/shifts", { headers: auth(nurse1.token) }), {
      params: Promise.resolve({ agencyId: "agency-a" }),
    });
    expect(ownA.status).toBe(200);
    expect(((await ownA.json()) as { shifts: Shift[] }).shifts.map((shift) => shift.id)).toEqual(
      expect.arrayContaining(["shift-1", "shift-2"]),
    );
    expect(((await ownB.json()) as { shifts: Shift[] }).shifts.map((shift) => shift.id)).toEqual(["shift-3"]);
    expect(cross.status).toBe(403);
    expect(nurseAgency.status).toBe(403);

    const nurseCreate = await createShift(
      endpoint("/api/shifts", {
        method: "POST",
        headers: auth(nurse1.token),
        body: JSON.stringify({ role: "RN", date: "2026-10-20", startTime: "19:00", endTime: "07:00" }),
      }),
    );
    const adminCreate = await createShift(
      endpoint("/api/shifts", {
        method: "POST",
        headers: auth(admin.token),
        body: JSON.stringify({ role: "RN", date: "2026-10-20", startTime: "19:00", endTime: "07:00" }),
      }),
    );
    expect(nurseCreate.status).toBe(403);
    expect(adminCreate.status).toBe(403);

    const invalid = await createShift(
      endpoint("/api/shifts", {
        method: "POST",
        headers: auth(agencyA.token),
        body: JSON.stringify({ role: "RN", date: "2026-02-31", startTime: "07:00", endTime: "07:00" }),
      }),
    );
    expect(invalid.status).toBe(400);

    const createdResponse = await createShift(
      endpoint("/api/shifts", {
        method: "POST",
        headers: auth(agencyA.token),
        body: JSON.stringify({ role: "RN", date: "2026-10-20", startTime: "19:00", endTime: "07:00" }),
      }),
    );
    const openShift = (await createdResponse.json()) as Shift;
    expect(createdResponse.status).toBe(201);
    expect(openShift.agencyId).toBe("agency-a");
    expect(openShift.claimedBy).toBeNull();
    expect(openShift.startTime).toBe("19:00");
    expect(openShift.endTime).toBe("07:00");
    created.push(openShift.id);

    const expired = await claim(
      endpoint(`/api/shifts/${openShift.id}/claim`, { method: "POST", headers: auth(nurse2.token), body: "{}" }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    expect(expired.status).toBe(403);
    expect(await expired.json()).toEqual({ error: "Credential expired, cannot claim shift" });

    const agencyClaim = await claim(
      endpoint(`/api/shifts/${openShift.id}/claim`, { method: "POST", headers: auth(agencyA.token), body: "{}" }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    expect(agencyClaim.status).toBe(403);

    const [first, second] = await Promise.all([
      claim(
        endpoint(`/api/shifts/${openShift.id}/claim`, { method: "POST", headers: auth(nurse1.token), body: "{}" }),
        { params: Promise.resolve({ id: openShift.id }) },
      ),
      claim(
        endpoint(`/api/shifts/${openShift.id}/claim`, { method: "POST", headers: auth(nurse1.token), body: "{}" }),
        { params: Promise.resolve({ id: openShift.id }) },
      ),
    ]);
    const outcomes = [first, second].map(async (response) => ({ status: response.status, body: await response.json() }));
    const raced = await Promise.all(outcomes);
    expect(raced.map((item) => item.status).sort()).toEqual([200, 409]);
    const winner = raced.find((item) => item.status === 200)?.body as Shift;
    expect(winner.claimedBy).toBe("nurse-1");
    expect(winner.status).toBe("filled");

    const otherCancel = await cancel(
      endpoint(`/api/shifts/${openShift.id}/cancel`, {
        method: "POST",
        headers: auth(nurse2.token),
        body: JSON.stringify({ reason: "no-show" }),
      }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    const otherAgency = await cancel(
      endpoint(`/api/shifts/${openShift.id}/cancel`, {
        method: "POST",
        headers: auth(agencyB.token),
        body: JSON.stringify({ reason: "advance" }),
      }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    const adminCancel = await cancel(
      endpoint(`/api/shifts/${openShift.id}/cancel`, {
        method: "POST",
        headers: auth(admin.token),
        body: JSON.stringify({ reason: "no-show" }),
      }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    expect(otherCancel.status).toBe(403);
    expect(otherAgency.status).toBe(403);
    expect(adminCancel.status).toBe(403);

    const reopened = await cancel(
      endpoint(`/api/shifts/${openShift.id}/cancel`, {
        method: "POST",
        headers: auth(nurse1.token),
        body: JSON.stringify({ reason: "advance" }),
      }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    const reopenedBody = (await reopened.json()) as Shift & {
      cancellation: { reason: string; previousNurseId: string };
    };
    expect(reopened.status).toBe(200);
    expect(reopenedBody.status).toBe("open");
    expect(reopenedBody.claimedBy).toBeNull();
    expect(reopenedBody.cancellation).toEqual({ reason: "advance", previousNurseId: "nurse-1" });

    const claimedAgain = await claim(
      endpoint(`/api/shifts/${openShift.id}/claim`, { method: "POST", headers: auth(nurse1.token), body: "{}" }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    expect(claimedAgain.status).toBe(200);
    const agencyCancel = await cancel(
      endpoint(`/api/shifts/${openShift.id}/cancel`, {
        method: "POST",
        headers: auth(agencyA.token),
        body: JSON.stringify({ reason: "no-show" }),
      }),
      { params: Promise.resolve({ id: openShift.id }) },
    );
    const agencyBody = (await agencyCancel.json()) as { cancellation: { reason: string; previousNurseId: string } };
    expect(agencyCancel.status).toBe(200);
    expect(agencyBody.cancellation).toEqual({ reason: "no-show", previousNurseId: "nurse-1" });

    deleteCreated();
    created.length = 0;
    const finalList = await listShifts(endpoint("/api/shifts", { headers: auth(admin.token) }));
    const finalShifts = ((await finalList.json()) as { shifts: Shift[] }).shifts.filter((shift) =>
      ["shift-1", "shift-2", "shift-3"].includes(shift.id),
    );
    expect(finalShifts).toEqual(trialShifts);
  });

  if (!enabled) {
    it("skips hosted mutations without SHIFT_PATCH_HOSTED_MUTATIONS=1", () => {
      expect(enabled).toBe(false);
    });
  }
});
