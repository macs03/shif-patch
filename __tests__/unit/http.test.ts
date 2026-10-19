import { readJson } from "@/lib/server/http";

function request(body?: BodyInit, headers?: HeadersInit): Request {
  return new Request("https://shiftpatch.test/api/auth/login", {
    method: "POST",
    body,
    headers,
    duplex: "half",
  } as RequestInit);
}

describe("bounded JSON requests", () => {
  it.each([65_535, 65_536])("accepts valid JSON occupying %i bytes", async (bytes) => {
    const input = request(" ".repeat(bytes - 2) + "{}");
    expect(await readJson(input)).toEqual({});
    expect(input.body?.locked).toBe(false);
  });

  it.each([undefined, "2", "65537"])("rejects oversized streams with Content-Length %s", async (length) => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(" ".repeat(65_536)));
        controller.enqueue(new TextEncoder().encode("{}"));
      },
      cancel() { cancelled = true; },
    });
    const input = request(stream, length ? { "content-length": length } : undefined);
    await expect(readJson(input)).rejects.toMatchObject({ status: 413, message: "Request body too large" });
    expect(cancelled).toBe(true);
    expect(input.body?.locked).toBe(false);
  });

  it("counts UTF-8 bytes rather than string length and decodes split characters", async () => {
    await expect(readJson(request(JSON.stringify("é".repeat(32_768)))))
      .rejects.toMatchObject({ status: 413 });
    const bytes = new TextEncoder().encode(JSON.stringify({ name: "José" }));
    const split = bytes.indexOf(0xc3) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    });
    expect(await readJson(request(stream))).toEqual({ name: "José" });
  });

  it("preserves empty bodies and rejects malformed JSON or unreadable streams", async () => {
    expect(await readJson(request())).toEqual({});
    expect(await readJson(request(" \n\t"))).toEqual({});
    await expect(readJson(request("{"))).rejects.toMatchObject({ status: 400, message: "Invalid request" });
    const input = request(new ReadableStream({ pull() { throw new Error("read failed"); } }));
    await expect(readJson(input)).rejects.toMatchObject({ status: 400, message: "Invalid request" });
    expect(input.body?.locked).toBe(false);
  });
});
