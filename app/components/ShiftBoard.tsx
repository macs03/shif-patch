"use client";

import type { ReactNode } from "react";

import type { CancellationReason, Shift } from "@/lib/domain/types";
import { Loader } from "./Loader";
import { ShiftCard } from "./ShiftCard";
import { IconRefresh } from "./UiIcons";

export function ShiftBoard({
  mode,
  status,
  loadError,
  shifts,
  pendingKey,
  hold,
  onRefresh,
  onClaim,
  onCancel,
  tabPanel,
  children,
}: {
  mode: "nurse" | "agency";
  status: "loading" | "ready" | "error";
  loadError: string | null;
  shifts: Shift[];
  pendingKey: string | null;
  hold: boolean;
  onRefresh: () => void;
  onClaim?: (shiftId: string) => void;
  onCancel: (shiftId: string, reason: CancellationReason) => void;
  tabPanel?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      id={tabPanel ? "nurse-panel-marketplace" : undefined}
      role={tabPanel ? "tabpanel" : undefined}
      tabIndex={tabPanel ? 0 : undefined}
      aria-labelledby={tabPanel ? "nurse-tab-marketplace" : undefined}
      className="board"
      aria-busy={status === "loading"}
    >
      <div className="board-bar">
        <h2>{mode === "nurse" ? "Marketplace" : "Your shifts"}</h2>
        <button
          type="button"
          className={`btn btn-icon btn-icon-muted${status === "loading" ? " btn-icon--spin" : ""}`}
          disabled={status === "loading"}
          onClick={onRefresh}
          aria-label="Refresh"
          title="Refresh"
        >
          <IconRefresh />
        </button>
      </div>
      {children}
      {status === "loading" ? <Loader label="Loading shifts" /> : null}
      {loadError ? (
        <div className="state-block">
          <p>{loadError}</p>
          <button type="button" className="btn" onClick={onRefresh}>Try again</button>
        </div>
      ) : null}
      {status === "ready" && shifts.length === 0 && !loadError ? (
        <p className="state-line">No shifts to show.</p>
      ) : null}
      {shifts.length > 0 ? (
        <ul className="cards">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              mode={mode}
              pending={pendingKey === `claim:${shift.id}` || pendingKey === `cancel:${shift.id}`}
              locked={hold || (pendingKey !== null && pendingKey !== `claim:${shift.id}` && pendingKey !== `cancel:${shift.id}`)}
              onClaim={(shiftId) => onClaim?.(shiftId)}
              onCancel={onCancel}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
