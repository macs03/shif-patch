import { z } from "zod";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const calendarDate = localDate.refine(isRealDate);

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

export const loginRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export const shiftIdSchema = z.string().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/);

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: sessionUserSchema,
});

export const createShiftRequestSchema = z
  .object({
    role: z.enum(["RN", "LPN"]),
    date: calendarDate,
    startTime: localTime,
    endTime: localTime,
  })
  .strict()
  .refine((value) => value.startTime !== value.endTime);

export const claimShiftRequestSchema = z.object({}).strict();

export const shiftsResponseSchema = z.object({
  shifts: z.array(shiftSchema),
});

export const agencyShiftsResponseSchema = shiftsResponseSchema.extend({
  agencyId: z.string().min(1),
});

export const cancelShiftRequestSchema = z
  .object({
    reason: z.enum(["no-show", "advance"]),
  })
  .strict();

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

const documentMime = z.enum(["application/pdf", "image/jpeg", "image/png"]);

export const credentialMetadataSchema = z
  .object({
    expiresOn: calendarDate,
    documentName: z.string().min(1).max(200).nullable(),
    mimeType: documentMime.nullable(),
    sizeBytes: z.number().int().positive().max(2_097_152).nullable(),
    uploadedAt: z.string().min(1).nullable(),
  })
  .strict()
  .refine((value) => {
    const fields = [value.documentName, value.mimeType, value.sizeBytes, value.uploadedAt];
    const present = fields.filter((field) => field !== null).length;
    return present === 0 || present === fields.length;
  });

export const credentialStatusSchema = z.enum(["valid", "expired", "missing"]);

export const credentialResponseSchema = z
  .object({
    credential: credentialMetadataSchema.nullable(),
    status: credentialStatusSchema,
  })
  .strict()
  .refine((value) => (value.credential === null) === (value.status === "missing"));

export const adminDashboardResponseSchema = z
  .object({
    shifts: z.array(shiftSchema),
    metrics: z
      .object({
        open: z.number().int().nonnegative(),
        filled: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict()
  .refine((value) => {
    const open = value.shifts.filter((shift) => shift.status === "open").length;
    return value.metrics.open === open && value.metrics.filled === value.shifts.length - open;
  });

export const auditEventSchema = z
  .object({
    id: z.string().uuid(),
    actorId: z.string().min(1),
    shiftId: z.string().min(1),
    action: z.enum(["create", "claim", "cancel"]),
    occurredAt: z.string().min(1),
    reason: z.enum(["no-show", "advance"]).nullable(),
    previousNurseId: z.string().min(1).nullable(),
  })
  .strict()
  .refine((value) => {
    if (value.action === "cancel") return value.reason !== null && value.previousNurseId !== null;
    return value.reason === null && value.previousNurseId === null;
  });

export const auditResponseSchema = z
  .object({
    events: z.array(auditEventSchema).max(50),
  })
  .strict();
