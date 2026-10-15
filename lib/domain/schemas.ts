import { z } from "zod";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const shiftBase = z.object({
  id: z.string().min(1),
  agencyId: z.string().min(1),
  agencyName: z.string().min(1),
  role: z.enum(["RN", "LPN"]),
  date: localDate,
  startTime: localTime,
  endTime: localTime,
});

export const shiftSchema = z.discriminatedUnion("status", [
  shiftBase.extend({ status: z.literal("open"), claimedBy: z.null() }),
  shiftBase.extend({ status: z.literal("filled"), claimedBy: z.string().min(1) }),
]);

export const userRoleSchema = z.enum(["nurse", "agency", "admin"]);

export const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: userRoleSchema,
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: sessionUserSchema,
});

export const createShiftRequestSchema = z.object({
  role: z.enum(["RN", "LPN"]),
  date: localDate,
  startTime: localTime,
  endTime: localTime,
});

export const shiftsResponseSchema = z.object({
  shifts: z.array(shiftSchema),
});

export const agencyShiftsResponseSchema = shiftsResponseSchema.extend({
  agencyId: z.string().min(1),
});

export const cancelShiftRequestSchema = z.object({
  reason: z.enum(["no-show", "advance"]),
});

export const cancelShiftResponseSchema = shiftSchema.and(
  z.object({
    cancellation: z.object({
      reason: z.enum(["no-show", "advance"]),
      previousNurseId: z.string().min(1),
    }),
  }),
);

export const apiErrorSchema = z.object({
  error: z.string().min(1),
});
