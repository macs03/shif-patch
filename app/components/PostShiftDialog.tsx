"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { CreateShiftRequest } from "@/lib/domain/types";
import { CreateShiftForm } from "./CreateShiftForm";
import { IconClose } from "./UiIcons";

export function PostShiftDialog({
  pending,
  locked,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  locked: boolean;
  onClose: () => void;
  onSubmit: (value: CreateShiftRequest) => void;
}) {
  const postDialog = useRef<HTMLDialogElement>(null);
  const suppressClose = useRef(0);

  useEffect(() => {
    const dialog = postDialog.current;
    if (!dialog) return;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    }
    return () => {
      if (dialog.open && typeof dialog.close === "function") {
        suppressClose.current += 1;
        dialog.close();
      } else dialog.removeAttribute("open");
    };
  }, []);

  return createPortal(
    <dialog
      ref={postDialog}
      className="modal"
      aria-labelledby="post-shift-title"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right
          && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) event.currentTarget.close();
      }}
      onClose={() => {
        if (suppressClose.current > 0) {
          suppressClose.current -= 1;
          return;
        }
        onClose();
      }}
    >
      <div className="modal-bar">
        <h2 id="post-shift-title">Post shift</h2>
        <button
          type="button"
          className="btn btn-icon btn-icon-muted"
          aria-label="Close"
          title="Close"
          onClick={() => {
            const dialog = postDialog.current;
            if (!dialog) return;
            if (typeof dialog.close === "function") dialog.close();
            else {
              dialog.removeAttribute("open");
              onClose();
            }
          }}
        >
          <IconClose />
        </button>
      </div>
      <CreateShiftForm pending={pending} locked={locked} onSubmit={onSubmit} />
    </dialog>,
    document.body,
  );
}
