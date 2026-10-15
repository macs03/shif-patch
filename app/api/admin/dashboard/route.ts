import { adminDashboardResponseSchema } from "@/lib/domain/schemas";
import { requireCaller } from "@/lib/server/auth";
import { readShifts } from "@/lib/server/db";
import { HttpError, json, methodNotAllowed, withErrors } from "@/lib/server/http";

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

export function GET(request: Request): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    if (caller.role !== "admin") throw new HttpError(403, "Forbidden");
    const shifts = await readShifts(caller.token);
    const open = shifts.filter((shift) => shift.status === "open").length;
    return json(adminDashboardResponseSchema.parse({
      shifts,
      metrics: { open, filled: shifts.length - open },
    }));
  });
}

export async function HEAD(request: Request): Promise<Response> {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}
