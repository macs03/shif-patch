import { createShiftRequestSchema, shiftsResponseSchema } from "@/lib/domain/schemas";
import { requireCaller } from "@/lib/server/auth";
import { createShift, readShifts } from "@/lib/server/db";
import { HttpError, json, methodNotAllowed, parseBody, readJson, withErrors } from "@/lib/server/http";

export function PUT(): Response {
  return methodNotAllowed();
}

export function PATCH(): Response {
  return methodNotAllowed();
}

export function DELETE(): Response {
  return methodNotAllowed();
}

export function GET(request: Request): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    const shifts = shiftsResponseSchema.parse({ shifts: await readShifts(caller.token) });
    return json(shifts);
  });
}

export async function HEAD(request: Request): Promise<Response> {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}

export function POST(request: Request): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    const body = parseBody(createShiftRequestSchema, await readJson(request));
    if (caller.role !== "agency") throw new HttpError(403, "Forbidden");
    const shift = await createShift(caller.token, body);
    return json(shift, 201);
  });
}
