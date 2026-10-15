import {
  cancelShiftRequestSchema,
  cancelShiftResponseSchema,
  shiftIdSchema,
} from "@/lib/domain/schemas";
import { requireCaller } from "@/lib/server/auth";
import { cancelShift } from "@/lib/server/db";
import { HttpError, json, methodNotAllowed, parseBody, readJson, withErrors } from "@/lib/server/http";

type Context = { params: Promise<{ id: string }> };

export function GET(): Response {
  return methodNotAllowed();
}

export function HEAD(): Response {
  return methodNotAllowed();
}

export function PUT(): Response {
  return methodNotAllowed();
}

export function PATCH(): Response {
  return methodNotAllowed();
}

export function DELETE(): Response {
  return methodNotAllowed();
}

export function POST(request: Request, context: Context): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    const { id } = await context.params;
    const shiftId = parseBody(shiftIdSchema, id);
    const body = parseBody(cancelShiftRequestSchema, await readJson(request));
    if (caller.role === "admin") throw new HttpError(403, "Forbidden");
    const result = await cancelShift(caller.token, shiftId, body.reason);
    return json(cancelShiftResponseSchema.parse(result));
  });
}
