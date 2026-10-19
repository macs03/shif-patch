"use client";

import { useId, useRef, type ReactNode } from "react";

import { Dialog } from "./Dialog";

export function ConfirmationDialog({
  title,
  confirmLabel,
  disabled,
  onConfirm,
  onClose,
  children
}: {
  title: string;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const descriptionId = useId();
  const accepted = useRef(false);

  return (
    <Dialog title={title} describedBy={descriptionId} onClose={onClose}>
      <div id={descriptionId} className="confirmation-dialog-content">
        {children}
      </div>

      <div className="board-bar">
        <button type="button" className="btn" autoFocus onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled}
          onClick={() => {
            if (disabled || accepted.current) return;
            accepted.current = true;
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
