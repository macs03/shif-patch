import {
  loginRequestSchema,
  loginResponseSchema,
} from "@/lib/domain/schemas";
import { login } from "@/lib/server/auth";
import { methodNotAllowed, parseBody, readJson, withErrors, json } from "@/lib/server/http";

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

export function POST(request: Request): Promise<Response> {
  return withErrors(async () => {
    const body = parseBody(loginRequestSchema, await readJson(request));
    const result = await login(body.email, body.password);
    const parsed = loginResponseSchema.parse(result);
    return json(parsed);
  });
}
