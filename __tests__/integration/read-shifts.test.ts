import { loadEnvLocal } from "@/__tests__/setup/load-env-local";
import { trialShifts } from "@/__tests__/fixtures/trial-shifts";

loadEnvLocal();

const hasHostedEnv = Boolean(
  process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim(),
);

describe("readShifts hosted integration", () => {
  jest.setTimeout(20_000);

  const testFn = hasHostedEnv ? it : it.skip;

  testFn("returns the three exact trial shifts", async () => {
    jest.resetModules();
    const { readShifts } = await import("@/lib/server/db");
    const shifts = await readShifts();
    expect(shifts).toEqual(trialShifts);
  });

  if (!hasHostedEnv) {
    it("skips hosted read when SUPABASE_URL or SUPABASE_SECRET_KEY is absent", () => {
      expect(hasHostedEnv).toBe(false);
    });
  }
});
