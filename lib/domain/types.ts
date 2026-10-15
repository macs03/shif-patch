import type { z } from "zod";

import type {
  agencyShiftsResponseSchema,
  apiErrorSchema,
  cancelShiftRequestSchema,
  cancelShiftResponseSchema,
  createShiftRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  sessionUserSchema,
  adminDashboardResponseSchema,
  auditEventSchema,
  auditResponseSchema,
  credentialMetadataSchema,
  credentialResponseSchema,
  credentialStatusSchema,
  shiftSchema,
  shiftsResponseSchema,
  userRoleSchema,
} from "./schemas";

/** Facility-local YYYY-MM-DD and HH:mm strings; never convert through UTC. */
export type UserRole = z.infer<typeof userRoleSchema>;
export type ShiftRole = z.infer<typeof shiftSchema>["role"];
export type ShiftStatus = z.infer<typeof shiftSchema>["status"];
export type CancellationReason = z.infer<typeof cancelShiftRequestSchema>["reason"];
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type CreateShiftRequest = z.infer<typeof createShiftRequestSchema>;
export type ShiftsResponse = z.infer<typeof shiftsResponseSchema>;
export type AgencyShiftsResponse = z.infer<typeof agencyShiftsResponseSchema>;
export type CancelShiftRequest = z.infer<typeof cancelShiftRequestSchema>;
export type CancelShiftResponse = z.infer<typeof cancelShiftResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type CredentialMetadata = z.infer<typeof credentialMetadataSchema>;
export type CredentialStatus = z.infer<typeof credentialStatusSchema>;
export type CredentialResponse = z.infer<typeof credentialResponseSchema>;
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditResponse = z.infer<typeof auditResponseSchema>;

export interface Agency {
  id: string;
  name: string;
}
export interface NurseCredential {
  nurseId: string;
  expiresOn: string;
}
