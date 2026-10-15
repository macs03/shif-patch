import {
  apiErrorSchema,
  loginRequestSchema,
  loginResponseSchema,
  shiftSchema,
  shiftsResponseSchema,
} from "@/lib/domain/schemas";
import { trialShifts } from "@/__tests__/fixtures/trial-shifts";

describe("packet schemas", () => {
  it("accepts the three trial shifts", () => {
    for (const shift of trialShifts) {
      expect(shiftSchema.parse(shift)).toEqual(shift);
    }
    expect(shiftsResponseSchema.parse({ shifts: trialShifts }).shifts).toHaveLength(3);
  });

  it("rejects open shift with claimedBy set", () => {
    const bad = { ...trialShifts[0], claimedBy: "nurse-1" };
    expect(shiftSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects invalid login email", () => {
    expect(
      loginRequestSchema.safeParse({
        email: "not-an-email",
        password: "Trial2026!",
      }).success,
    ).toBe(false);
  });

  it("accepts login response shape", () => {
    expect(
      loginResponseSchema.parse({
        token: "jwt",
        user: { id: "nurse-1", name: "Maria Lopez", role: "nurse" },
      }).user.role,
    ).toBe("nurse");
  });

  it("accepts api error contract", () => {
    expect(apiErrorSchema.parse({ error: "Invalid email or password" }).error).toBe(
      "Invalid email or password",
    );
  });
});
