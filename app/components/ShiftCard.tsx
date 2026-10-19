"use client";

import { useState } from "react";

import type { CancellationReason, Shift } from "@/lib/domain/types";
import { ConfirmationDialog } from "./ConfirmationDialog";

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
  const [confirmation, setConfirmation] = useState<{ action: "claim" } | { action: "reopen"; reason: CancellationReason } | null>(null);
  const overnight = shift.endTime < shift.startTime;
  const busy = pending || locked;
  const canConfirm = !busy && (confirmation?.action === "claim"
    ? mode === "nurse" && shift.status === "open"
    : mode === "agency" && shift.status === "filled");

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
          onClick={() => {
            if (!busy) setConfirmation({ action: "claim" });
          }}
        >
          {pending ? "Claiming" : "Claim shift"}
        </button>
      ) : null}
      {mode === "agency" && shift.status === "filled" ? (
        <form
          className="cancel-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) setConfirmation({ action: "reopen", reason });
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
      {confirmation ? (
        <ConfirmationDialog
          title={confirmation.action === "claim" ? "Claim this shift?" : "Reopen this shift?"}
          confirmLabel={confirmation.action === "claim" ? "Confirm claim" : "Confirm reopening"}
          disabled={!canConfirm}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            if (!canConfirm) return;
            setConfirmation(null);
            if (confirmation.action === "claim") onClaim(shift.id);
            else onCancel(shift.id, confirmation.reason);
          }}
        >
          <p>{shift.agencyName} — {shift.role}</p>
          <p>{shift.date}, {shift.startTime}–{shift.endTime}{overnight ? " (overnight)" : ""}</p>
          {confirmation.action === "reopen" ? (
            <p>Reason: {confirmation.reason}. This removes the current assignment and makes the shift available again.</p>
          ) : <p>Are you sure you want to claim this shift?</p>}
        </ConfirmationDialog>
      ) : null}
    </li>
  );
}
