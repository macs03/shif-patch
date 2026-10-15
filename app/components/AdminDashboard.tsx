"use client";

import { formatScheduledDuration } from "@/lib/domain/credentials";
import type { AuditEvent, Shift } from "@/lib/domain/types";

type Load = "loading" | "ready" | "error";

export function AdminDashboard({
  shifts,
  metrics,
  shiftState,
  shiftError,
  events,
  auditState,
  auditError,
  onRefresh,
}: {
  shifts: Shift[];
  metrics: { open: number; filled: number } | null;
  shiftState: Load;
  shiftError: string | null;
  events: AuditEvent[];
  auditState: Load;
  auditError: string | null;
  onRefresh: () => void;
}) {
  const filled = shifts.filter((shift) => shift.status === "filled");

  return (
    <section className="board" aria-busy={shiftState === "loading"}>
      <div className="board-bar">
        <h2>Operations</h2>
        <button type="button" className="btn" disabled={shiftState === "loading"} onClick={onRefresh}>
          Refresh
        </button>
      </div>
      {shiftState === "loading" ? <p className="state-line">Loading shifts</p> : null}
      {shiftState === "ready" && metrics ? (
        <p className="metrics">
          <span>Open {metrics.open}</span>
          <span>Filled {metrics.filled}</span>
        </p>
      ) : null}
      {shiftError ? (
        <div className="state-block">
          <p>{shiftError}</p>
          <button type="button" className="btn" onClick={onRefresh}>Try again</button>
        </div>
      ) : null}
      {shiftState === "ready" && shifts.length === 0 && !shiftError ? (
        <p className="state-line">No shifts to show.</p>
      ) : null}
      {shifts.length > 0 ? (
        <div className="table-wrap">
          <table data-testid="admin-dashboard-shift-table">
            <caption>Shifts across both agencies</caption>
            <thead>
              <tr>
                <th scope="col">Agency</th>
                <th scope="col">Role</th>
                <th scope="col">Date</th>
                <th scope="col">Hours</th>
                <th scope="col">Status</th>
                <th scope="col">Claimant</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.agencyName}</td>
                  <td>{shift.role}</td>
                  <td>{shift.date}</td>
                  <td>{shift.startTime}–{shift.endTime}</td>
                  <td>
                    <span
                      className={shift.status === "open" ? "status status-open" : "status status-filled"}
                      data-testid="admin-shift-status-badge"
                    >
                      {shift.status}
                    </span>
                  </td>
                  <td>{shift.claimedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <h2>Audit</h2>
      {auditState === "loading" ? <p className="state-line">Loading audit</p> : null}
      {auditError ? <p className="state-line">{auditError}</p> : null}
      {auditState === "ready" && events.length === 0 && !auditError ? (
        <p className="state-line">No audit events yet.</p>
      ) : null}
      {events.length > 0 ? (
        <div className="table-wrap">
          <table data-testid="audit-log-table">
            <caption>Latest successful shift actions</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Action</th>
                <th scope="col">Actor</th>
                <th scope="col">Shift</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.occurredAt}</td>
                  <td>{event.action}</td>
                  <td>{event.actorId}</td>
                  <td>{event.shiftId}</td>
                  <td>{event.action === "cancel" ? `${event.reason}, previous ${event.previousNurseId}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <h2>Scheduled hours</h2>
      <p className="state-line">Scheduled hours for filled assignments. These are not verified work or payable hours.</p>
      {shiftState === "ready" && filled.length === 0 && !shiftError ? (
        <p className="state-line">No filled assignments to preview.</p>
      ) : null}
      {filled.length > 0 ? (
        <div className="table-wrap">
          <table data-testid="timesheet-table">
            <caption>Scheduled assignment preview</caption>
            <thead>
              <tr>
                <th scope="col">Shift</th>
                <th scope="col">Nurse</th>
                <th scope="col">Agency</th>
                <th scope="col">Date</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Scheduled duration</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.id}</td>
                  <td>{shift.claimedBy}</td>
                  <td>{shift.agencyName}</td>
                  <td>{shift.date}</td>
                  <td>{shift.startTime}</td>
                  <td>{shift.endTime}</td>
                  <td>{formatScheduledDuration(shift.startTime, shift.endTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
