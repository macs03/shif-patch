import { credentialResponseSchema } from "@/lib/domain/schemas";
import { requireCaller } from "@/lib/server/auth";
import { readCredential, saveCredential } from "@/lib/server/credentials";
import { json, methodNotAllowed, withErrors } from "@/lib/server/http";

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
    return json(credentialResponseSchema.parse(await readCredential(caller)));
  });
}

export async function HEAD(request: Request): Promise<Response> {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}

export function POST(request: Request): Promise<Response> {
  return withErrors(async () => {
    const caller = await requireCaller(request);
    return json(credentialResponseSchema.parse(await saveCredential(caller, request)));
  });
}
