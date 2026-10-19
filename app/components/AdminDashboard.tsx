"use client";

import { useState } from "react";

import { formatScheduledDuration } from "@/lib/domain/credentials";
import type { AuditEvent, Shift } from "@/lib/domain/types";
import { Loader } from "./Loader";
import { IconRefresh } from "./UiIcons";

type Load = "loading" | "ready" | "error";
type AdminPanel = "operations" | "audit" | "scheduled";

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
  const [panel, setPanel] = useState<AdminPanel>("operations");
  const [statusFilter, setStatusFilter] = useState<"open" | "filled" | null>(null);
  const filled = shifts.filter((shift) => shift.status === "filled");
  const visibleShifts = statusFilter ? shifts.filter((shift) => shift.status === statusFilter) : shifts;

  function toggleStatus(status: "open" | "filled") {
    setStatusFilter((current) => (current === status ? null : status));
  }
  const refreshBusy = shiftState === "loading" || auditState === "loading";

  return (
    <>
      <div className="role-tabs" role="tablist" aria-label="Admin">
        <button
          type="button"
          role="tab"
          id="admin-tab-operations"
          className="role-tab"
          aria-selected={panel === "operations"}
          aria-controls="admin-panel-operations"
          onClick={() => setPanel("operations")}
        >
          Operations
        </button>
        <button
          type="button"
          role="tab"
          id="admin-tab-audit"
          className="role-tab"
          aria-selected={panel === "audit"}
          aria-controls="admin-panel-audit"
          onClick={() => setPanel("audit")}
        >
          Audit
        </button>
        <button
          type="button"
          role="tab"
          id="admin-tab-scheduled"
          className="role-tab"
          aria-selected={panel === "scheduled"}
          aria-controls="admin-panel-scheduled"
          onClick={() => setPanel("scheduled")}
        >
          Scheduled hours
        </button>
      </div>
      {panel === "operations" ? (
        <section
          id="admin-panel-operations"
          className="board"
          role="tabpanel"
          aria-labelledby="admin-tab-operations"
          aria-busy={shiftState === "loading"}
        >
          <div className="board-bar">
            <h2>Operations</h2>
            <button
              type="button"
              className={`btn btn-icon btn-icon-muted${shiftState === "loading" ? " btn-icon--spin" : ""}`}
              disabled={shiftState === "loading"}
              onClick={onRefresh}
              aria-label="Refresh"
              title="Refresh"
            >
              <IconRefresh />
            </button>
          </div>
          {shiftState === "loading" ? <Loader label="Loading shifts" /> : null}
          {shiftState === "ready" && metrics ? (
            <div className="metric-chips" role="group" aria-label="Filter shifts">
              <button
                type="button"
                className="metric-chip metric-chip-all"
                data-testid="operations-metric-all"
                aria-pressed={statusFilter === null}
                onClick={() => setStatusFilter(null)}
              >
                <span className="metric-chip-label">All</span>
                <span className="metric-chip-value">{metrics.open + metrics.filled}</span>
              </button>
              <button
                type="button"
                className="metric-chip metric-chip-open"
                data-testid="operations-metric-open"
                aria-pressed={statusFilter === "open"}
                onClick={() => toggleStatus("open")}
              >
                <span className="metric-chip-label">Open</span>
                <span className="metric-chip-value">{metrics.open}</span>
              </button>
              <button
                type="button"
                className="metric-chip metric-chip-filled"
                data-testid="operations-metric-filled"
                aria-pressed={statusFilter === "filled"}
                onClick={() => toggleStatus("filled")}
              >
                <span className="metric-chip-label">Filled</span>
                <span className="metric-chip-value">{metrics.filled}</span>
              </button>
            </div>
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
          {shiftState === "ready" && shifts.length > 0 && visibleShifts.length === 0 ? (
            <p className="state-line">No shifts match this filter.</p>
          ) : null}
          {visibleShifts.length > 0 ? (
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
                  {visibleShifts.map((shift) => (
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
        </section>
      ) : null}
      {panel === "audit" ? (
        <section
          id="admin-panel-audit"
          className="board"
          role="tabpanel"
          aria-labelledby="admin-tab-audit"
          aria-busy={auditState === "loading"}
        >
          <div className="board-bar">
            <h2>Audit</h2>
            <button
              type="button"
              className={`btn btn-icon btn-icon-muted${auditState === "loading" ? " btn-icon--spin" : ""}`}
              disabled={refreshBusy}
              onClick={onRefresh}
              aria-label="Refresh"
              title="Refresh"
            >
              <IconRefresh />
            </button>
          </div>
          {auditState === "loading" ? <Loader label="Loading audit" /> : null}
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
        </section>
      ) : null}
      {panel === "scheduled" ? (
        <section
          id="admin-panel-scheduled"
          className="board"
          role="tabpanel"
          aria-labelledby="admin-tab-scheduled"
          aria-busy={shiftState === "loading"}
        >
          <div className="board-bar">
            <h2>Scheduled hours</h2>
            <button
              type="button"
              className={`btn btn-icon btn-icon-muted${shiftState === "loading" ? " btn-icon--spin" : ""}`}
              disabled={shiftState === "loading"}
              onClick={onRefresh}
              aria-label="Refresh"
              title="Refresh"
            >
              <IconRefresh />
            </button>
          </div>
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
      ) : null}
    </>
  );
}
