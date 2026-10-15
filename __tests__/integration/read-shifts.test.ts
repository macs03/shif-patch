import { loadEnvLocal } from "@/__tests__/setup/load-env-local";

loadEnvLocal();

const hasHostedEnv = Boolean(
  process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_PUBLISHABLE_KEY?.trim(),
);

describe("readShifts hosted integration", () => {
  jest.setTimeout(20_000);
  const testFn = hasHostedEnv ? it : it.skip;

  testFn("returns the baseline shifts for a logged-in admin", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const { readShifts } = await import("@/lib/server/db");
    const { trialShifts } = await import("@/__tests__/fixtures/trial-shifts");
    const response = await POST(
      new Request("https://shiftpatch.test/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "alex.kim@example.com", password: "Trial2026!" }),
      }),
    );
    const body = (await response.json()) as { token: string };
    expect(response.status).toBe(200);
    const shifts = await readShifts(body.token);
    expect(shifts).toEqual(expect.arrayContaining(trialShifts));
    expect(shifts.filter((shift) => ["shift-1", "shift-2", "shift-3"].includes(shift.id))).toEqual(
      trialShifts,
    );
  });

  if (!hasHostedEnv) {
    it("skips hosted read when SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is absent", () => {
      expect(hasHostedEnv).toBe(false);
    });
  }
});
