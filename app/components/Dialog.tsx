"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconClose } from "./UiIcons";

export function Dialog({ title, titleId, describedBy, onClose, children }: {
  title: string;
  titleId?: string;
  describedBy?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const generatedId = useId();
  const headingId = titleId ?? generatedId;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const suppressClose = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
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

  function close() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      onClose();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={headingId}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right
          && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) close();
      }}
      onClose={(event) => {
        event.stopPropagation();
        if (suppressClose.current > 0) {
          suppressClose.current -= 1;
          return;
        }
        onClose();
      }}
    >
      <div className="modal-bar">
        <h2 id={headingId}>{title}</h2>
        <button
          type="button"
          className="btn btn-icon btn-icon-muted"
          aria-label="Close"
          title="Close"
          onClick={close}
        >
          <IconClose />
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
