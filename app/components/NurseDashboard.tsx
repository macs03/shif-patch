"use client";

import type { CancellationReason, CredentialResponse, Shift } from "@/lib/domain/types";
import { CredentialForm } from "./CredentialForm";
import { RoleTabs } from "./RoleTabs";
import { ShiftBoard } from "./ShiftBoard";

const nurseTabs = [
  { value: "marketplace", label: "Marketplace" },
  { value: "credential", label: "Credential" },
] as const;

export type NursePanel = "marketplace" | "credential";

export function NurseDashboard({
  panel,
  onPanelChange,
  status,
  loadError,
  shifts,
  pendingKey,
  hold,
  onRefresh,
  onClaim,
  onCancel,
  credentialView,
  credentialError,
  credentialPending,
  onCredentialSubmit,
}: {
  panel: NursePanel;
  onPanelChange: (panel: NursePanel) => void;
  status: "loading" | "ready" | "error";
  loadError: string | null;
  shifts: Shift[];
  pendingKey: string | null;
  hold: boolean;
  onRefresh: () => void;
  onClaim: (shiftId: string) => void;
  onCancel: (shiftId: string, reason: CancellationReason) => void;
  credentialView: CredentialResponse | null;
  credentialError: string | null;
  credentialPending: boolean;
  onCredentialSubmit: (document: File, expiresOn: string) => void;
}) {
  return (
    <>
      <RoleTabs label="Nurse" idPrefix="nurse" tabs={nurseTabs} value={panel} onChange={onPanelChange} />
      {panel === "credential" ? (
        <div
          id="nurse-panel-credential"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="nurse-tab-credential"
        >
          <CredentialForm
            view={credentialView}
            loadError={credentialError}
            pending={credentialPending}
            onSubmit={onCredentialSubmit}
          />
        </div>
      ) : (
        <ShiftBoard
          mode="nurse"
          tabPanel
          status={status}
          loadError={loadError}
          shifts={shifts}
          pendingKey={pendingKey}
          hold={hold}
          onRefresh={onRefresh}
          onClaim={onClaim}
          onCancel={onCancel}
        />
      )}
    </>
  );
}
