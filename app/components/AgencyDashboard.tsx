"use client";

import type { CancellationReason, CreateShiftRequest, Shift } from "@/lib/domain/types";
import { PostShiftDialog } from "./PostShiftDialog";
import { ShiftBoard } from "./ShiftBoard";

export function AgencyDashboard({
  status,
  loadError,
  shifts,
  pendingKey,
  hold,
  creating,
  onOpenCreate,
  onCloseCreate,
  onRefresh,
  onPublish,
  onCancel,
}: {
  status: "loading" | "ready" | "error";
  loadError: string | null;
  shifts: Shift[];
  pendingKey: string | null;
  hold: boolean;
  creating: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  onRefresh: () => void;
  onPublish: (value: CreateShiftRequest) => void;
  onCancel: (shiftId: string, reason: CancellationReason) => void;
}) {
  return (
    <ShiftBoard
      mode="agency"
      status={status}
      loadError={loadError}
      shifts={shifts}
      pendingKey={pendingKey}
      hold={hold}
      onRefresh={onRefresh}
      onCancel={onCancel}
    >
      <button
        type="button"
        data-testid="agency-post-shift-button"
        className="btn btn-primary"
        onClick={onOpenCreate}
      >
        Post shift
      </button>
      {creating ? (
        <PostShiftDialog
          pending={pendingKey === "publish"}
          locked={hold}
          onClose={onCloseCreate}
          onSubmit={onPublish}
        />
      ) : null}
    </ShiftBoard>
  );
}
