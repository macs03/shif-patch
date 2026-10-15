/** Facility-local YYYY-MM-DD and HH:mm strings; never convert through UTC. */
export type UserRole = "nurse" | "agency" | "admin";
export type ShiftRole = "RN" | "LPN";
export type ShiftStatus = "open" | "filled";
export type CancellationReason = "no-show" | "advance";
export interface SessionUser { id: string; name: string; role: UserRole }
export interface Agency { id: string; name: string }
export interface NurseCredential { nurseId: string; expiresOn: string }
export interface Shift {
  id: string;
  agencyId: string;
  agencyName: string;
  role: ShiftRole;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  claimedBy: string | null;
}
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { token: string; user: SessionUser }
export interface CreateShiftRequest { role: ShiftRole; date: string; startTime: string; endTime: string }
export interface ShiftsResponse { shifts: Shift[] }
export interface AgencyShiftsResponse extends ShiftsResponse { agencyId: string }
export interface CancelShiftRequest { reason: CancellationReason }
export interface CancelShiftResponse extends Shift {
  cancellation: { reason: CancellationReason; previousNurseId: string };
}
export interface ApiError { error: string }
