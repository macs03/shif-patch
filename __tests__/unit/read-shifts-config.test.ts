describe("readShifts configuration", () => {
  const priorUrl = process.env.SUPABASE_URL;
  const priorKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.SUPABASE_URL = priorUrl;
    process.env.SUPABASE_PUBLISHABLE_KEY = priorKey;
    jest.resetModules();
  });

  it("throws a generic message when Supabase env is missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    jest.resetModules();
    const { readShifts } = await import("@/lib/server/db");
    await expect(readShifts("token")).rejects.toThrow("Internal server error");
  });
});
