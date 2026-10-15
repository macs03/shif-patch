import type { z } from "zod";

const NO_STORE = { "Cache-Control": "no-store" };

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

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
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
