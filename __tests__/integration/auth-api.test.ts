import { loadEnvLocal } from "@/__tests__/setup/load-env-local";
import { trialShifts } from "@/__tests__/fixtures/trial-shifts";

loadEnvLocal();

const hasHostedEnv = Boolean(
  process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_PUBLISHABLE_KEY?.trim(),
);

const users = [
  { email: "admin@sunrisehealth.example", id: "agency-a", role: "agency" },
  { email: "admin@metrocare.example", id: "agency-b", role: "agency" },
  { email: "maria.lopez@example.com", id: "nurse-1", role: "nurse" },
  { email: "james.cook@example.com", id: "nurse-2", role: "nurse" },
  { email: "alex.kim@example.com", id: "admin-1", role: "admin" },
];

describe("hosted auth and shift reads", () => {
  jest.setTimeout(30_000);
  const testFn = hasHostedEnv ? it : it.skip;

  testFn("logs in each sample user and lists the baseline shifts", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const { GET } = await import("@/app/api/shifts/route");
    for (const user of users) {
      const response = await POST(
        new Request("https://shiftpatch.test/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: user.email, password: "Trial2026!" }),
        }),
      );
      const body = (await response.json()) as {
        token: string;
        user: { id: string; role: string; name: string };
      };
      expect(response.status).toBe(200);
      expect(body.user.id).toBe(user.id);
      expect(body.user.role).toBe(user.role);
      expect(Object.keys(body).sort()).toEqual(["token", "user"]);
      expect(Object.keys(body.user).sort()).toEqual(["id", "name", "role"]);
      const list = await GET(
        new Request("https://shiftpatch.test/api/shifts", {
          headers: { authorization: `Bearer ${body.token}` },
        }),
      );
      const listed = (await list.json()) as { shifts: unknown[] };
      expect(list.status).toBe(200);
      expect(listed.shifts).toEqual(expect.arrayContaining(trialShifts));
    }
  });

  testFn("hides unknown emails and wrong passwords behind one message", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    for (const body of [
      { email: "nobody@example.com", password: "Trial2026!" },
      { email: "maria.lopez@example.com", password: "not-the-password" },
    ]) {
      const response = await POST(
        new Request("https://shiftpatch.test/api/auth/login", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Invalid email or password" });
    }
  });

  if (!hasHostedEnv) {
    it("skips hosted auth when SUPABASE_PUBLISHABLE_KEY is absent", () => {
      expect(hasHostedEnv).toBe(false);
    });
  }
});
