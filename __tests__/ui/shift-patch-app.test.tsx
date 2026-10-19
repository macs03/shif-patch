import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import { ShiftPatchApp } from "@/app/components/ShiftPatchApp";
import type { Shift } from "@/lib/domain/types";

const nurse = { id: "nurse-1", name: "Maria Lopez", role: "nurse" };
const nurse2 = { id: "nurse-9", name: "Eligible Nurse", role: "nurse" };
const agencyA = { id: "agency-a", name: "Sunrise Health Staffing", role: "agency" };
const admin = { id: "admin-1", name: "Alex Kim", role: "admin" };

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    json: async () => body,
  } as Response;
}

function installFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => (
    Promise.resolve(handler(String(input), init))
  )) as typeof fetch;
}

function calls(urlPart: string): RequestInit[] {
  return (fetch as jest.Mock).mock.calls
    .filter(([url]) => String(url).includes(urlPart))
    .map(([, init]) => init as RequestInit);
}

async function signIn(email: string, password = "Trial2026!") {
  fireEvent.change(screen.getByTestId("login-email-input"), { target: { value: email } });
  fireEvent.change(screen.getByTestId("login-password-input"), { target: { value: password } });
  fireEvent.click(screen.getByTestId("login-submit-button"));
}

function card(id: string) {
  const item = screen.getAllByTestId("shift-list-item").find((node) => node.getAttribute("data-shift-id") === id);
  if (!item) throw new Error(`Missing card ${id}`);
  return within(item);
}

describe("ShiftPatchApp", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("toggles password visibility without clearing the value", () => {
    render(<ShiftPatchApp />);
    const password = screen.getByTestId("login-password-input");
    fireEvent.change(password, { target: { value: "Trial2026!" } });
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("Trial2026!");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("routes a nurse and an agency, and clears the password", async () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      return jsonResponse({ shifts: trialShifts });
    });

    const view = render(<ShiftPatchApp />);
    expect(screen.getByTestId("login-email-input")).toHaveAttribute("id", "login-email");
    expect(screen.getByLabelText("Email")).toBe(screen.getByTestId("login-email-input"));
    expect(screen.getByLabelText("Password")).toBe(screen.getByTestId("login-password-input"));
    await signIn("maria.lopez@example.com");

    expect(await screen.findByRole("heading", { name: "Maria Lopez" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Marketplace" })).toBeInTheDocument();
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(3);
    expect(screen.getAllByText("Sunrise Health Staffing").length).toBeGreaterThan(0);
    expect(screen.getByText("Metro Care Partners")).toBeInTheDocument();
    expect(screen.getByText("2026-10-02")).toBeInTheDocument();
    expect(card("shift-1").getByText("Open")).toBeInTheDocument();
    expect(card("shift-1").getByText("Overnight")).toBeInTheDocument();
    expect(card("shift-1").getByText("19:00–07:00")).toBeInTheDocument();
    expect(card("shift-2").getByText("Filled")).toBeInTheDocument();
    expect(card("shift-2").getByText("Assigned nurse nurse-1")).toBeInTheDocument();
    expect(card("shift-1").getByTestId("shift-claim-button")).toBeInTheDocument();
    expect(screen.queryByTestId("shift-cancel-button")).not.toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByTestId("login-password-input")).toHaveValue("");
    expect(screen.queryByTestId("shift-list-item")).not.toBeInTheDocument();

    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login")) return Promise.resolve(jsonResponse({ token: "token-agency", user: agencyA }));
      return Promise.resolve(jsonResponse({
        agencyId: "agency-a",
        shifts: trialShifts.filter((shift) => shift.agencyId === "agency-a"),
      }));
    });
    await signIn("admin@sunrisehealth.example");
    expect(await screen.findByRole("heading", { name: "Your shifts" })).toBeInTheDocument();
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(2);
    expect(screen.queryByText("Metro Care Partners")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shift-claim-button")).not.toBeInTheDocument();
    expect(card("shift-2").getByTestId("shift-cancel-button")).toBeInTheDocument();
    expect(screen.queryByLabelText("Agency")).not.toBeInTheDocument();

    view.unmount();
    render(<ShiftPatchApp />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a banner for invalid credentials and an unavailable login service", async () => {
    installFetch(() => jsonResponse({ error: "Invalid email or password" }, 401));
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com", "wrong");
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-button")).toBeEnabled();

    (fetch as jest.Mock).mockImplementation(() => Promise.reject(new TypeError("offline")));
    await signIn("maria.lopez@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent("The service could not be reached.");
    expect(screen.queryByRole("heading", { name: "Marketplace" })).not.toBeInTheDocument();
  });

  it("returns to login when a protected request is unauthorized and drops a stale list", async () => {
    let releaseList: (response: Response) => void = () => undefined;
    const hanging = new Promise<Response>((resolve) => {
      releaseList = resolve;
    });
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      return hanging;
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    await screen.findByRole("heading", { name: "Marketplace" });
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    releaseList(jsonResponse({
      shifts: [{ ...trialShifts[0], agencyName: "Ghost Agency" }],
    }));
    await waitFor(() => {
      expect(screen.queryByText("Ghost Agency")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login")) return Promise.resolve(jsonResponse({ token: "token-nurse", user: nurse }));
      return Promise.resolve(jsonResponse({ error: "Unauthorized" }, 401));
    });
    await signIn("maria.lopez@example.com");
    expect(await screen.findByText("Your session has expired. Sign in again.")).toBeInTheDocument();
    expect(screen.queryByTestId("shift-list-item")).not.toBeInTheDocument();
  });

  it("keeps the newer shift list when an older refresh finishes last", async () => {
    let releaseSlow: (response: Response) => void = () => undefined;
    const slowList = new Promise<Response>((resolve) => {
      releaseSlow = resolve;
    });
    let lists = 0;
    const fresh = trialShifts.map((shift) => (
      shift.id === "shift-1" ? { ...shift, agencyName: "Fresh Agency" } : shift
    ));
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/api/credentials")) return jsonResponse({ credential: null, status: "missing" });
      lists += 1;
      if (lists === 1) return jsonResponse({ shifts: trialShifts });
      if (lists === 2) return slowList;
      return jsonResponse({ shifts: fresh });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Fresh Agency")).toBeInTheDocument();
    await act(async () => {
      releaseSlow(jsonResponse({
        shifts: [{ ...trialShifts[0], id: "shift-stale", agencyName: "Stale Agency" }],
      }));
    });
    expect(screen.queryByText("Stale Agency")).not.toBeInTheDocument();
    expect(screen.getByText("Fresh Agency")).toBeInTheDocument();
    expect(screen.getAllByTestId("shift-list-item")).toHaveLength(3);
  });

  it("claims an open shift and rejects an expired credential without marking it filled", async () => {
    const shifts = trialShifts.map((shift) => ({ ...shift }));
    installFetch((url, init) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/claim")) {
        if (init?.body && String(init.body) !== "{}") return jsonResponse({ error: "Invalid request" }, 400);
        const claimed: Shift = { ...shifts[0], status: "filled", claimedBy: "nurse-1" };
        shifts[0] = claimed;
        return jsonResponse(claimed);
      }
      return jsonResponse({ shifts });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(3);
    fireEvent.click(card("shift-1").getByTestId("shift-claim-button"));
    expect(await screen.findByText("Shift claimed.")).toBeInTheDocument();
    expect(card("shift-1").getByText("Filled")).toBeInTheDocument();
    expect(card("shift-1").getByText("Assigned nurse nurse-1")).toBeInTheDocument();
    expect(card("shift-1").queryByTestId("shift-claim-button")).not.toBeInTheDocument();
    const claim = calls("/claim");
    expect(claim).toHaveLength(1);
    expect(claim[0]?.headers).toMatchObject({ Authorization: "Bearer token-nurse" });
  });

  it("shows the credential error and reloads the winner after a conflict", async () => {
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/claim")) return jsonResponse({ error: "Credential expired, cannot claim shift" }, 403);
      return jsonResponse({ shifts: trialShifts });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(3);
    fireEvent.click(card("shift-1").getByTestId("shift-claim-button"));
    expect(await screen.findByText("Credential expired, cannot claim shift")).toBeInTheDocument();
    expect(card("shift-1").getByText("Open")).toBeInTheDocument();

    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/claim")) return Promise.resolve(jsonResponse({ error: "Shift is not available" }, 409));
      return Promise.resolve(jsonResponse({
        shifts: trialShifts.map((shift) => (
          shift.id === "shift-1" ? { ...shift, status: "filled", claimedBy: nurse2.id } : shift
        )),
      }));
    });
    fireEvent.click(card("shift-1").getByTestId("shift-claim-button"));
    expect(await screen.findByText("Shift is not available")).toBeInTheDocument();
    expect(card("shift-1").getByText("Assigned nurse nurse-9")).toBeInTheDocument();
  });

  it("blocks a repeated claim and reconciles an uncertain result", async () => {
    let releaseClaim: (response: Response | Promise<Response>) => void = () => undefined;
    const claimGate = new Promise<Response>((resolve) => {
      releaseClaim = resolve;
    });
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/claim")) return claimGate;
      return jsonResponse({ shifts: trialShifts });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(3);
    const button = card("shift-1").getByTestId("shift-claim-button");
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(calls("/claim")).toHaveLength(1));
    expect(button).toBeDisabled();
    releaseClaim(jsonResponse({ ...trialShifts[0], status: "filled", claimedBy: "nurse-1" }));
    expect(await screen.findByText("Shift claimed.")).toBeInTheDocument();

    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/claim")) return Promise.reject(new TypeError("socket hang up"));
      return Promise.resolve(jsonResponse({ shifts: trialShifts }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(card("shift-3").getByText("Open")).toBeInTheDocument());
    fireEvent.click(card("shift-3").getByTestId("shift-claim-button"));
    expect(await screen.findByText(/The outcome is uncertain/)).toBeInTheDocument();
    expect(card("shift-3").getByText("Open")).toBeInTheDocument();
    expect(screen.queryByText("Shift claimed.")).not.toBeInTheDocument();
    await waitFor(() => expect(card("shift-3").getByTestId("shift-claim-button")).toBeEnabled());
  });

  it("publishes a valid shift and blocks an invalid form", async () => {
    const own = trialShifts.filter((shift) => shift.agencyId === "agency-a");
    const created: Shift = {
      id: "shift-new",
      agencyId: "agency-a",
      agencyName: "Sunrise Health Staffing",
      role: "RN",
      date: "2026-10-20",
      startTime: "19:00",
      endTime: "07:00",
      status: "open",
      claimedBy: null,
    };
    installFetch((url, init) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-agency", user: agencyA });
      if (url.endsWith("/api/shifts") && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          role: "RN",
          date: "2026-10-20",
          startTime: "19:00",
          endTime: "07:00",
        });
        own.push(created);
        return jsonResponse(created, 201);
      }
      return jsonResponse({ agencyId: "agency-a", shifts: own });
    });
    render(<ShiftPatchApp />);
    await signIn("admin@sunrisehealth.example");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(2);
    fireEvent.click(screen.getByTestId("agency-post-shift-button"));
    expect(screen.getByRole("dialog", { name: "Post shift" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("agency-post-shift-submit-button"));
    expect(await screen.findByText("Choose RN or LPN.")).toBeInTheDocument();
    expect(calls("/api/shifts").filter((init) => init?.method === "POST")).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "RN" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-02-31" } });
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "07:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "07:00" } });
    fireEvent.click(screen.getByTestId("agency-post-shift-submit-button"));
    expect(await screen.findByText(/Start and end must differ/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-10-20" } });
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "19:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "07:00" } });
    fireEvent.click(screen.getByTestId("agency-post-shift-submit-button"));
    expect(await screen.findByText("Shift published.")).toBeInTheDocument();
    expect(card("shift-new").getByText("Open")).toBeInTheDocument();
    expect(card("shift-new").queryByText(/Assigned nurse/)).not.toBeInTheDocument();
  });

  it("reopens a filled shift for advance and no-show", async () => {
    const own = trialShifts.filter((shift) => shift.agencyId === "agency-a").map((shift) => ({ ...shift }));
    installFetch((url, init) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-agency", user: agencyA });
      if (url.includes("/cancel")) {
        const reason = JSON.parse(String(init?.body)).reason as "advance" | "no-show";
        const reopened: Shift = { ...own[1], status: "open", claimedBy: null };
        own[1] = reopened;
        return jsonResponse({ ...reopened, cancellation: { reason, previousNurseId: "nurse-1" } });
      }
      return jsonResponse({ agencyId: "agency-a", shifts: own });
    });
    render(<ShiftPatchApp />);
    await signIn("admin@sunrisehealth.example");
    expect(await screen.findAllByTestId("shift-list-item")).toHaveLength(2);
    fireEvent.click(card("shift-2").getByTestId("shift-cancel-button"));
    await waitFor(() => expect(card("shift-2").getByText("Open")).toBeInTheDocument());
    expect(screen.getByText("Shift reopened.")).toBeInTheDocument();
    expect(JSON.parse(String(calls("/cancel")[0]?.body))).toEqual({ reason: "advance" });
    expect(card("shift-2").queryByTestId("shift-cancel-button")).not.toBeInTheDocument();

    own[1] = { ...trialShifts[1] };
    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/cancel")) {
        expect(JSON.parse(String(init?.body))).toEqual({ reason: "no-show" });
        const reopened: Shift = { ...own[1], status: "open", claimedBy: null };
        own[1] = reopened;
        return Promise.resolve(jsonResponse({ ...reopened, cancellation: { reason: "no-show", previousNurseId: "nurse-1" } }));
      }
      return Promise.resolve(jsonResponse({ agencyId: "agency-a", shifts: own }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(card("shift-2").getByText("Filled")).toBeInTheDocument());
    fireEvent.change(card("shift-2").getByLabelText("Reason"), { target: { value: "no-show" } });
    fireEvent.click(card("shift-2").getByTestId("shift-cancel-button"));
    await waitFor(() => expect(card("shift-2").getByText("Open")).toBeInTheDocument());
    expect(screen.getByText("Shift reopened.")).toBeInTheDocument();
  });

  it("shows an empty list, a load error with retry, and an admin scope message", async () => {
    let fail = true;
    installFetch((url) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/api/credentials")) return jsonResponse({ credential: null, status: "missing" });
      if (fail) return jsonResponse({ error: "Service unavailable" }, 503);
      return jsonResponse({ shifts: [] });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No shifts to show.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    (fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login")) return Promise.resolve(jsonResponse({ token: "token-admin", user: admin }));
      if (url.endsWith("/api/admin/dashboard")) {
        return Promise.resolve(jsonResponse({ shifts: trialShifts, metrics: { open: 2, filled: 1 } }));
      }
      if (url.endsWith("/api/admin/audit")) return Promise.resolve(jsonResponse({ events: [] }));
      return Promise.reject(new Error("admin must not call staffing endpoints"));
    });
    await signIn("alex.kim@example.com");
    expect(await screen.findByRole("heading", { name: "Operations" })).toBeInTheDocument();
    expect(await screen.findByTestId("admin-dashboard-shift-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("admin-shift-status-badge").map((badge) => badge.textContent)).toEqual(["open", "filled", "open"]);
    expect(screen.getByTestId("operations-metric-open")).toHaveTextContent("Open2");
    expect(screen.getByTestId("operations-metric-filled")).toHaveTextContent("Filled1");
    fireEvent.click(screen.getByTestId("operations-metric-open"));
    expect(screen.getAllByTestId("admin-shift-status-badge").map((badge) => badge.textContent)).toEqual(["open", "open"]);
    fireEvent.click(screen.getByTestId("operations-metric-filled"));
    expect(screen.getAllByTestId("admin-shift-status-badge").map((badge) => badge.textContent)).toEqual(["filled"]);
    fireEvent.click(screen.getByTestId("operations-metric-all"));
    expect(screen.getAllByTestId("admin-shift-status-badge").map((badge) => badge.textContent)).toEqual(["open", "filled", "open"]);
    expect(screen.getByText("Metro Care Partners")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Audit" }));
    expect(await screen.findByText("No audit events yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Scheduled hours" }));
    expect(await screen.findByTestId("timesheet-table")).toHaveTextContent("12h");
    expect(screen.getByText(/not verified work or payable hours/)).toBeInTheDocument();
    expect(screen.queryByTestId("agency-post-shift-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("shift-claim-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("credential-upload-input")).not.toBeInTheDocument();
  });

  it("shows the nurse credential form and keeps an expired upload from looking eligible", async () => {
    installFetch((url, init) => {
      if (url.endsWith("/api/auth/login")) return jsonResponse({ token: "token-nurse", user: nurse });
      if (url.endsWith("/api/credentials") && init?.method === "POST") {
        return jsonResponse({
          credential: {
            expiresOn: "2020-01-01",
            documentName: "license.pdf",
            mimeType: "application/pdf",
            sizeBytes: 5,
            uploadedAt: "2026-10-15T12:00:00.000Z",
          },
          status: "expired",
        });
      }
      if (url.endsWith("/api/credentials")) {
        return jsonResponse({
          credential: {
            expiresOn: "2027-01-01",
            documentName: null,
            mimeType: null,
            sizeBytes: null,
            uploadedAt: null,
          },
          status: "valid",
        });
      }
      return jsonResponse({ shifts: trialShifts });
    });
    render(<ShiftPatchApp />);
    await signIn("maria.lopez@example.com");
    expect(await screen.findByRole("heading", { name: "Maria Lopez" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Credential" }));
    expect(await screen.findByTestId("credential-upload-input")).toBeInTheDocument();
    expect(screen.getByTestId("credential-expiry-date-input")).toBeInTheDocument();
    expect(await screen.findByText("Eligible through 2027-01-01. No document has been uploaded.")).toBeInTheDocument();
    expect(screen.getByTestId("credential-status-tag")).toHaveTextContent("Active");

    const file = new File(["%PDF-"], "license.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("credential-upload-input"), { target: { files: [file] } });
    fireEvent.change(screen.getByTestId("credential-expiry-date-input"), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save credential" }));
    expect(await screen.findByText("Credential saved. It is expired and cannot be used to claim a shift.")).toBeInTheDocument();
    expect(screen.getByText("Expired on 2020-01-01. This credential cannot be used to claim a shift.")).toBeInTheDocument();
    expect(screen.getByTestId("credential-status-tag")).toHaveTextContent("Expired");
    const post = calls("/api/credentials").find((init) => init?.method === "POST");
    expect(post?.body).toBeInstanceOf(FormData);
    expect(post?.headers && "Content-Type" in (post.headers as object)).toBe(false);
  });
});
