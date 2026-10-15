describe("readShifts configuration", () => {
  const priorUrl = process.env.SUPABASE_URL;
  const priorKey = process.env.SUPABASE_SECRET_KEY;

  afterEach(() => {
    process.env.SUPABASE_URL = priorUrl;
    process.env.SUPABASE_SECRET_KEY = priorKey;
    jest.resetModules();
  });

  it("throws a generic message when Supabase env is missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    jest.resetModules();
    const { readShifts } = await import("@/lib/server/db");
    await expect(readShifts()).rejects.toThrow("Supabase server configuration is invalid");
  });
});
