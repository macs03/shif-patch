import type { z } from "zod";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_JSON_BODY_BYTES = 64 * 1024;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function methodNotAllowed(): Response {
  return json({ error: "Method not allowed" }, 405);
}

export async function readBody(request: Request, maxBytes: number, tooLargeMessage: string): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    const declared = request.headers.get("content-length");
    if (declared !== null) {
      if (!/^\d+$/.test(declared)) throw new HttpError(400, "Invalid request");
      if (Number(declared) > maxBytes) throw new HttpError(413, tooLargeMessage);
    }
    if (!reader) return new Uint8Array(0);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) throw new HttpError(413, tooLargeMessage);
      chunks.push(value);
    }
  } catch (error) {
    try {
      await reader?.cancel();
    } catch (cleanupError) {
      void cleanupError;
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Invalid request");
  } finally {
    try {
      reader?.releaseLock();
    } catch (cleanupError) {
      void cleanupError;
    }
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readJson(request: Request): Promise<unknown> {
  const body = await readBody(request, MAX_JSON_BODY_BYTES, "Request body too large");
  const text = new TextDecoder().decode(body);
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "Invalid request");
  }
}

export function parseBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpError(400, "Invalid request");
  return parsed.data;
}

export async function withErrors(work: () => Promise<Response>): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    return json({ error: "Internal server error" }, 500);
  }
}
