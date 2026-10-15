import { agencyShiftsResponseSchema, shiftIdSchema } from "@/lib/domain/schemas";
import { requireCaller } from "@/lib/server/auth";
import { readAgencyShifts } from "@/lib/server/db";
import { HttpError, json, methodNotAllowed, parseBody, withErrors } from "@/lib/server/http";

type Context = { params: Promise<{ agencyId: string }> };

export function POST(): Response {
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

export function GET(request: Request, context: Context): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    const { agencyId } = await context.params;
    const pathAgencyId = parseBody(shiftIdSchema, agencyId);
    if (caller.role !== "agency" || caller.agencyId !== pathAgencyId) {
      throw new HttpError(403, "Forbidden");
    }
    const body = agencyShiftsResponseSchema.parse({
      agencyId: pathAgencyId,
      shifts: await readAgencyShifts(caller.token, pathAgencyId),
    });
    return json(body);
  });
}

export async function HEAD(request: Request, context: Context): Promise<Response> {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}
