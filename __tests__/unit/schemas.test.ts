import {
  apiErrorSchema,
  cancelShiftRequestSchema,
  claimShiftRequestSchema,
  createShiftRequestSchema,
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

  it("rejects unknown login fields and accepts fixture emails", () => {
    expect(
      loginRequestSchema.safeParse({
        email: "maria.lopez@example.com",
        password: "Trial2026!",
        role: "admin",
      }).success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({
        email: "admin@sunrisehealth.example",
        password: "Trial2026!",
      }).success,
    ).toBe(true);
  });

  it("rejects impossible dates, equal times and unknown create fields", () => {
    expect(
      createShiftRequestSchema.safeParse({
        role: "RN",
        date: "2026-02-31",
        startTime: "19:00",
        endTime: "07:00",
      }).success,
    ).toBe(false);
    expect(
      createShiftRequestSchema.safeParse({
        role: "RN",
        date: "2026-10-16",
        startTime: "07:00",
        endTime: "07:00",
      }).success,
    ).toBe(false);
    expect(
      createShiftRequestSchema.safeParse({
        role: "RN",
        date: "2026-10-16",
        startTime: "19:00",
        endTime: "07:00",
        agencyId: "agency-b",
      }).success,
    ).toBe(false);
    expect(
      createShiftRequestSchema.parse({
        role: "RN",
        date: "2026-10-16",
        startTime: "19:00",
        endTime: "07:00",
      }).endTime,
    ).toBe("07:00");
  });

  it("rejects a nonempty claim body and an unknown cancellation reason", () => {
    expect(claimShiftRequestSchema.safeParse({}).success).toBe(true);
    expect(claimShiftRequestSchema.safeParse({ nurseId: "nurse-1" }).success).toBe(false);
    expect(cancelShiftRequestSchema.safeParse({ reason: "late" }).success).toBe(false);
    expect(cancelShiftRequestSchema.parse({ reason: "no-show" }).reason).toBe("no-show");
  });
});
