export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_CREDENTIAL_BODY_BYTES = MAX_DOCUMENT_BYTES + 64 * 1024;

export type DocumentMime = "application/pdf" | "image/jpeg" | "image/png";
export type DocumentIssue = "empty" | "oversize" | "unsupported" | "invalid";

const MIME_BY_EXTENSION: Record<string, DocumentMime> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function bogotaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function deriveCredentialStatus(
  expiresOn: string | null,
  today = bogotaToday(),
): "valid" | "expired" | "missing" {
  if (!expiresOn) return "missing";
  return expiresOn < today ? "expired" : "valid";
}

export function scheduledMinutes(startTime: string, endTime: string): number {
  const start = minutes(startTime);
  const end = minutes(endTime);
  if (start === null || end === null || start === end) return 0;
  return end > start ? end - start : end + 24 * 60 - start;
}

function minutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatScheduledDuration(startTime: string, endTime: string): string {
  const total = scheduledMinutes(startTime, endTime);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function signatureMime(bytes: Uint8Array): DocumentMime | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return "application/pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

export function inspectDocument(input: {
  filename: string;
  declaredType: string;
  bytes: Uint8Array;
}): { ok: true; filename: string; mimeType: DocumentMime } | { ok: false; issue: DocumentIssue } {
  if (typeof input.filename !== "string") return { ok: false, issue: "invalid" };
  const base = input.filename.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base || base.length > 200 || /[\u0000-\u001f]/.test(base)) return { ok: false, issue: "invalid" };
  const dot = base.lastIndexOf(".");
  const mimeType = dot >= 0 ? MIME_BY_EXTENSION[base.slice(dot + 1).toLowerCase()] : undefined;
  if (!mimeType) return { ok: false, issue: "unsupported" };
  if (input.bytes.byteLength === 0) return { ok: false, issue: "empty" };
  if (input.bytes.byteLength > MAX_DOCUMENT_BYTES) return { ok: false, issue: "oversize" };
  const declared = input.declaredType.trim().toLowerCase();
  if (declared && declared !== mimeType) return { ok: false, issue: "unsupported" };
  if (signatureMime(input.bytes) !== mimeType) return { ok: false, issue: "unsupported" };
  return { ok: true, filename: base, mimeType };
}
