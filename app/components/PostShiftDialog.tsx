"use client";

import type { CreateShiftRequest } from "@/lib/domain/types";
import { CreateShiftForm } from "./CreateShiftForm";
import { Dialog } from "./Dialog";

export function PostShiftDialog({ pending, locked, onClose, onSubmit }: {
  pending: boolean;
  locked: boolean;
  onClose: () => void;
  onSubmit: (value: CreateShiftRequest) => void;
}) {
  return (
    <Dialog title="Post shift" titleId="post-shift-title" onClose={onClose}>
      <CreateShiftForm pending={pending} locked={locked} onSubmit={onSubmit} />
    </Dialog>
  );
}
