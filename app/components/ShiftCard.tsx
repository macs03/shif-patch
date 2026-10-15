"use client";

import { useState } from "react";

import type { CancellationReason, Shift } from "@/lib/domain/types";

export function ShiftCard({
  shift,
  mode,
  pending,
  locked,
  onClaim,
  onCancel,
}: {
  shift: Shift;
  mode: "nurse" | "agency";
  pending: boolean;
  locked: boolean;
  onClaim: (shiftId: string) => void;
  onCancel: (shiftId: string, reason: CancellationReason) => void;
}) {
  const [reason, setReason] = useState<CancellationReason>("advance");
  const overnight = shift.endTime < shift.startTime;
  const busy = pending || locked;

  return (
    <li data-testid="shift-list-item" data-shift-id={shift.id} className="card">
      <div className="card-head">
        <p className="card-agency">{shift.agencyName}</p>
        <p className={`status status-${shift.status}`}>{shift.status === "open" ? "Open" : "Filled"}</p>
      </div>
      <h3>{shift.role}</h3>
      <p className="card-when">
        <time dateTime={shift.date}>{shift.date}</time>
        <span>
          {shift.startTime}–{shift.endTime}
        </span>
        {overnight ? <span className="overnight">Overnight</span> : null}
      </p>
      {shift.status === "filled" ? <p className="assignee">Assigned nurse {shift.claimedBy}</p> : null}
      {mode === "nurse" && shift.status === "open" ? (
        <button
          type="button"
          data-testid="shift-claim-button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => onClaim(shift.id)}
        >
          {pending ? "Claiming" : "Claim shift"}
        </button>
      ) : null}
      {mode === "agency" && shift.status === "filled" ? (
        <form
          className="cancel-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) onCancel(shift.id, reason);
          }}
        >
          <label>
            Reason
            <select
              value={reason}
              disabled={busy}
              onChange={(event) => setReason(event.target.value as CancellationReason)}
            >
              <option value="advance">Advance</option>
              <option value="no-show">No-show</option>
            </select>
          </label>
          <button type="submit" data-testid="shift-cancel-button" className="btn" disabled={busy}>
            {pending ? "Reopening" : "Reopen shift"}
          </button>
        </form>
      ) : null}
    </li>
  );
}
