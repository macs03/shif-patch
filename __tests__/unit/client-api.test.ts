import { claimShift, readCredential } from "@/lib/client/api";

describe("client API cancellation and failures", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([200, 503])("preserves response-body cancellation for HTTP %i", async (status) => {
    const aborted = new DOMException("Cancelled", "AbortError");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: status === 200,
      status,
      json: async () => { throw aborted; },
    } as unknown as Response);
    await expect(readCredential("token")).rejects.toBe(aborted);
  });

  it("preserves fetch cancellation", async () => {
    const aborted = new DOMException("Cancelled", "AbortError");
    jest.spyOn(global, "fetch").mockRejectedValue(aborted);
    await expect(readCredential("token")).rejects.toBe(aborted);
  });

  it("keeps malformed successful mutation responses uncertain", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
    await expect(claimShift("token", "shift-1")).rejects.toMatchObject({ name: "ApiError", uncertain: true });
    await expect(readCredential("token")).rejects.toMatchObject({ name: "ApiError", uncertain: false });
  });
});
