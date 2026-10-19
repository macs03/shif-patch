"use client";

import { useState, type FormEvent } from "react";

import { calendarDate } from "@/lib/domain/schemas";
import type { CredentialResponse } from "@/lib/domain/types";

function statusCopy(view: CredentialResponse | null): string {
  if (!view) return "Loading credential";
  if (view.status === "missing" || !view.credential) return "No credential on file. You cannot claim shifts.";
  const { expiresOn, documentName } = view.credential;
  if (view.status === "expired") {
    return `Expired on ${expiresOn}. This credential cannot be used to claim a shift.`;
  }
  if (!documentName) return `Eligible through ${expiresOn}. No document has been uploaded.`;
  return `Eligible through ${expiresOn}. Current document: ${documentName}.`;
}

function statusTag(
  view: CredentialResponse | null,
  loadError: string | null,
): { label: string; className: string } {
  if (loadError) {
    return { label: "Unavailable", className: "credential-status credential-status-muted" };
  }
  if (!view) {
    return { label: "Checking", className: "credential-status credential-status-muted" };
  }
  if (view.status === "valid") {
    return { label: "Active", className: "credential-status credential-status-active" };
  }
  if (view.status === "expired") {
    return { label: "Expired", className: "credential-status credential-status-expired" };
  }
  return { label: "Not on file", className: "credential-status credential-status-muted" };
}

export function CredentialForm({
  view,
  loadError,
  pending,
  onSubmit,
}: {
  view: CredentialResponse | null;
  loadError: string | null;
  pending: boolean;
  onSubmit: (document: File, expiresOn: string) => void;
}) {
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!file || file.size === 0) {
      setError("Choose a PDF, JPEG, or PNG.");
      return;
    }
    if (!calendarDate.safeParse(date).success) {
      setError("Enter a real expiration date.");
      return;
    }
    setError("");
    onSubmit(file, date);
  }

  const tag = statusTag(view, loadError);

  return (
    <section className="board" aria-busy={view === null && !loadError}>
      <div className="credential-head">
        <h2>Credential</h2>
        <span
          className={tag.className}
          data-testid="credential-status-tag"
          role="status"
          aria-label={`Credential status: ${tag.label}`}
        >
          {tag.label}
        </span>
      </div>
      <p className="state-line">{loadError ?? statusCopy(view)}</p>
      <form className="create-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="credential-document">Document</label>
          <input
            id="credential-document"
            data-testid="credential-upload-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field">
          <label htmlFor="credential-expiry">Expiration date</label>
          <input
            id="credential-expiry"
            data-testid="credential-expiry-date-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        {error ? <p className="field-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving credential" : "Save credential"}
        </button>
      </form>
    </section>
  );
}
