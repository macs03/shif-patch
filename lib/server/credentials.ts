import "server-only";

import {
  deriveCredentialStatus,
  inspectDocument,
  MAX_CREDENTIAL_BODY_BYTES,
  type DocumentIssue,
} from "../domain/credentials";
import { calendarDate, credentialResponseSchema } from "../domain/schemas";
import type { CredentialResponse } from "../domain/types";
import type { Caller } from "./auth";
import { throwDataError } from "./db";
import { HttpError } from "./http";
import { createDataClient, supabaseConfig } from "./supabase";

type CredentialRow = {
  expires_on: string;
  document_name: string | null;
  mime_type: "application/pdf" | "image/jpeg" | "image/png" | null;
  size_bytes: number | string | null;
  uploaded_at: string | null;
  object_path: string | null;
  previous_object_path?: string | null;
};

function client(token: string) {
  return createDataClient(supabaseConfig(), token);
}

function issueStatus(issue: DocumentIssue): HttpError {
  if (issue === "oversize") return new HttpError(413, "File too large");
  if (issue === "unsupported") return new HttpError(415, "Unsupported document type");
  return new HttpError(400, "Invalid request");
}

async function boundedBody(request: Request): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) throw new HttpError(400, "Invalid request");
    if (Number(declared) > MAX_CREDENTIAL_BODY_BYTES) throw new HttpError(413, "File too large");
  }
  if (!request.body) throw new HttpError(400, "Invalid request");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_CREDENTIAL_BODY_BYTES) throw new HttpError(413, "File too large");
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Invalid request");
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function formFrom(request: Request, body: Uint8Array): Promise<FormData> {
  const type = request.headers.get("content-type");
  if (!type || !type.toLowerCase().includes("multipart/form-data")) {
    throw new HttpError(400, "Invalid request");
  }
  try {
    return await new Request(request.url, {
      method: "POST",
      headers: { "content-type": type },
      body: Buffer.from(body),
    }).formData();
  } catch {
    throw new HttpError(400, "Invalid request");
  }
}

function fileBytes(file: File): Promise<Uint8Array> {
  return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

async function oneDocument(form: FormData): Promise<{ name: string; type: string; bytes: Uint8Array }> {
  const names = new Set(form.keys());
  if (names.size !== 2 || !names.has("document") || !names.has("expiresOn")) {
    throw new HttpError(400, "Invalid request");
  }
  if (form.getAll("document").length !== 1 || form.getAll("expiresOn").length !== 1) {
    throw new HttpError(400, "Invalid request");
  }
  const document = form.get("document");
  if (!(document instanceof File)) throw new HttpError(400, "Invalid request");
  const name = typeof document.name === "string" ? document.name : "";
  if (!name) throw new HttpError(400, "Invalid request");
  return { name, type: document.type, bytes: await fileBytes(document) };
}

function expiresOn(form: FormData): string {
  const value = form.get("expiresOn");
  if (typeof value !== "string") throw new HttpError(400, "Invalid request");
  const parsed = calendarDate.safeParse(value);
  if (!parsed.success) throw new HttpError(400, "Invalid request");
  return parsed.data;
}

function present(row: CredentialRow | null): CredentialResponse {
  if (!row) return credentialResponseSchema.parse({ credential: null, status: "missing" });
  const size = row.size_bytes === null ? null : Number(row.size_bytes);
  return credentialResponseSchema.parse({
    status: deriveCredentialStatus(row.expires_on),
    credential: {
      expiresOn: row.expires_on,
      documentName: row.document_name,
      mimeType: row.mime_type,
      sizeBytes: size,
      uploadedAt: row.uploaded_at,
    },
  });
}

async function rpcRows(token: string, fn: "read_credential" | "finalize_credential", args?: Record<string, string | number>): Promise<CredentialRow[]> {
  const supabase = client(token);
  let data: unknown;
  let error: { message: string; code?: string } | null;
  try {
    const result = await supabase.rpc(fn, args);
    data = result.data;
    error = result.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (error) throwDataError(error);
  if (data === null) return [];
  if (!Array.isArray(data)) throw new HttpError(500, "Internal server error");
  return data as CredentialRow[];
}

export async function readCredential(caller: Caller): Promise<CredentialResponse> {
  if (caller.role !== "nurse") throw new HttpError(403, "Forbidden");
  const rows = await rpcRows(caller.token, "read_credential");
  if (rows.length > 1) throw new HttpError(500, "Internal server error");
  return present(rows[0] ?? null);
}

async function removeObject(token: string, path: string): Promise<boolean> {
  try {
    const result = await client(token).storage.from("credentials").remove([path]);
    return !result.error;
  } catch {
    return false;
  }
}

export async function saveCredential(caller: Caller, request: Request): Promise<CredentialResponse> {
  if (caller.role !== "nurse") throw new HttpError(403, "Forbidden");
  const body = await boundedBody(request);
  const form = await formFrom(request, body);
  const document = await oneDocument(form);
  const date = expiresOn(form);
  const inspected = inspectDocument({
    filename: document.name,
    declaredType: document.type,
    bytes: document.bytes,
  });
  if (!inspected.ok) throw issueStatus(inspected.issue);

  const objectPath = `${caller.authUserId}/${crypto.randomUUID()}`;
  const supabase = client(caller.token);
  let uploadError: { message?: string } | null;
  try {
    const uploaded = await supabase.storage.from("credentials").upload(objectPath, new Blob([Buffer.from(document.bytes)], { type: inspected.mimeType }), {
      contentType: inspected.mimeType,
      upsert: false,
    });
    uploadError = uploaded.error;
  } catch {
    throw new HttpError(503, "Service unavailable");
  }
  if (uploadError) {
    const message = uploadError.message ?? "";
    if (/exceeded|too large|413/i.test(message)) throw new HttpError(413, "File too large");
    if (/mime|type|415/i.test(message)) throw new HttpError(415, "Unsupported document type");
    if (/fetch failed|network|timeout/i.test(message)) throw new HttpError(503, "Service unavailable");
    throw new HttpError(500, "Internal server error");
  }

  try {
    const rows = await rpcRows(caller.token, "finalize_credential", {
      p_expires_on: date,
      p_object_path: objectPath,
      p_document_name: inspected.filename,
      p_mime_type: inspected.mimeType,
      p_size_bytes: document.bytes.byteLength,
    });
    const row = rows[0];
    if (!row || row.object_path !== objectPath) throw new HttpError(500, "Internal server error");
    if (row.previous_object_path && row.previous_object_path !== objectPath) {
      await removeObject(caller.token, row.previous_object_path);
    }
    return present(row);
  } catch (error) {
    let active: CredentialRow | null = null;
    let readable = true;
    try {
      const rows = await rpcRows(caller.token, "read_credential");
      active = rows[0] ?? null;
    } catch {
      readable = false;
    }
    if (active?.object_path === objectPath) return present(active);
    if (readable) await removeObject(caller.token, objectPath);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Internal server error");
  }
}
