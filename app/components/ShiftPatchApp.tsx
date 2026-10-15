"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { loginRequestSchema } from "@/lib/domain/schemas";
import {
  ApiError,
  cancelShift,
  claimShift,
  createShift,
  listAgency,
  listMarketplace,
  login,
} from "@/lib/client/api";
import type { CancellationReason, SessionUser, Shift } from "@/lib/domain/types";
import { CreateShiftForm } from "./CreateShiftForm";
import { NotificationBanner } from "./NotificationBanner";
import { ShiftCard } from "./ShiftCard";

type Session = { token: string; user: SessionUser };
type Notice = { tone: "success" | "error"; message: string } | null;
type ListState = { status: "loading" | "ready" | "error"; shifts: Shift[]; loadError: string | null };

const EXPIRED = "Your session has expired. Sign in again.";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function upsert(shifts: Shift[], shift: Shift): Shift[] {
  const next = shifts.some((item) => item.id === shift.id)
    ? shifts.map((item) => (item.id === shift.id ? shift : item))
    : [...shifts, shift];
  return next.toSorted((a, b) => a.id.localeCompare(b.id));
}

export function ShiftPatchApp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [list, setList] = useState<ListState>({ status: "ready", shifts: [], loadError: null });
  const [creating, setCreating] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hold, setHold] = useState(false);

  const epoch = useRef(0);
  const inflight = useRef(new Set<AbortController>());
  const pendingRef = useRef<string | null>(null);
  const holdRef = useRef(false);
  const loginLock = useRef(false);

  const setHoldBoth = useCallback((value: boolean) => {
    holdRef.current = value;
    setHold(value);
  }, []);

  const clearPending = useCallback(() => {
    pendingRef.current = null;
    setPendingKey(null);
  }, []);

  const invalidate = useCallback(() => {
    epoch.current += 1;
    for (const controller of inflight.current) controller.abort();
    inflight.current.clear();
    clearPending();
  }, [clearPending]);

  const expire = useCallback(() => {
    invalidate();
    setHoldBoth(false);
    setSession(null);
    setCreating(false);
    setEmail("");
    setPassword("");
    setLoginError("");
    setList({ status: "ready", shifts: [], loadError: null });
    setNotice({ tone: "error", message: EXPIRED });
  }, [invalidate, setHoldBoth]);

  const load = useCallback(async (
    target: Session,
    signal: AbortSignal,
    snap: number,
    releaseHold: boolean,
  ): Promise<boolean> => {
    try {
      const shifts = target.user.role === "agency"
        ? await listAgency(target.token, target.user.id, signal)
        : await listMarketplace(target.token, signal);
      if (epoch.current !== snap) return false;
      setList({ status: "ready", shifts, loadError: null });
      if (releaseHold) setHoldBoth(false);
      return true;
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap) return false;
      if (error instanceof ApiError && error.status === 401) {
        expire();
        return false;
      }
      const message = error instanceof ApiError ? error.message : "Shifts could not be loaded.";
      setList((prev) => (
        prev.shifts.length > 0
          ? { status: "ready", shifts: prev.shifts, loadError: message }
          : { status: "error", shifts: [], loadError: message }
      ));
      return false;
    }
  }, [expire, setHoldBoth]);

  useEffect(() => {
    if (!session || session.user.role === "admin") return;
    const controller = new AbortController();
    const requests = inflight.current;
    requests.add(controller);
    const snap = epoch.current;
    void load(session, controller.signal, snap, false);
    return () => {
      controller.abort();
      requests.delete(controller);
    };
  }, [session, load]);

  function begin(key: string): { signal: AbortSignal; snap: number } | null {
    if (!session || pendingRef.current || holdRef.current) return null;
    pendingRef.current = key;
    setPendingKey(key);
    const controller = new AbortController();
    inflight.current.add(controller);
    return { signal: controller.signal, snap: epoch.current };
  }

  function finish(controllerSignal: AbortSignal) {
    for (const controller of inflight.current) {
      if (controller.signal === controllerSignal) inflight.current.delete(controller);
    }
    clearPending();
  }

  async function refresh(releaseHold: boolean) {
    if (!session || session.user.role === "admin") return;
    const current = session;
    const controller = new AbortController();
    inflight.current.add(controller);
    await load(current, controller.signal, epoch.current, releaseHold);
    inflight.current.delete(controller);
  }

  async function settleMutation(
    current: Session,
    key: string,
    success: string,
    work: (signal: AbortSignal) => Promise<Shift>,
  ) {
    const request = begin(key);
    if (!request) return;
    try {
      const shift = await work(request.signal);
      if (epoch.current !== request.snap) return;
      setList((prev) => ({ status: "ready", shifts: upsert(prev.shifts, shift), loadError: null }));
      setNotice({ tone: "success", message: success });
      await load(current, request.signal, request.snap, false);
    } catch (error) {
      if (isAbort(error) || epoch.current !== request.snap) return;
      if (error instanceof ApiError && error.status === 401) {
        expire();
        return;
      }
      if (error instanceof ApiError && error.uncertain) {
        setHoldBoth(true);
        const reconciled = await load(current, request.signal, request.snap, true);
        if (epoch.current !== request.snap) return;
        setNotice({
          tone: "error",
          message: reconciled
            ? "The outcome is uncertain. The list is up to date and you can try again."
            : "The outcome is uncertain. Refresh the list before trying again.",
        });
        return;
      }
      const message = error instanceof ApiError ? error.message : "The request failed.";
      setNotice({ tone: "error", message });
      if (error instanceof ApiError && error.status === 409) {
        await load(current, request.signal, request.snap, false);
      }
    } finally {
      if (epoch.current === request.snap) finish(request.signal);
    }
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginPending || loginLock.current) return;
    const parsed = loginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      setLoginError("Enter a valid email and password.");
      return;
    }
    loginLock.current = true;
    setLoginPending(true);
    setLoginError("");
    setNotice(null);
    const controller = new AbortController();
    inflight.current.add(controller);
    const snap = epoch.current;
    try {
      const result = await login(parsed.data.email, parsed.data.password, controller.signal);
      if (epoch.current !== snap) return;
      setPassword("");
      setNotice(null);
      setList(result.user.role === "admin"
        ? { status: "ready", shifts: [], loadError: null }
        : { status: "loading", shifts: [], loadError: null });
      setSession({ token: result.token, user: result.user });
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap) return;
      const message = error instanceof ApiError ? error.message : "The service could not be reached.";
      setLoginError(message);
      setNotice({ tone: "error", message });
    } finally {
      inflight.current.delete(controller);
      if (epoch.current === snap) {
        loginLock.current = false;
        setLoginPending(false);
      }
    }
  }

  function signOut() {
    invalidate();
    setHoldBoth(false);
    setSession(null);
    setCreating(false);
    setEmail("");
    setPassword("");
    setLoginError("");
    setNotice(null);
    setList({ status: "ready", shifts: [], loadError: null });
  }

  const mode = session?.user.role === "nurse" || session?.user.role === "agency" ? session.user.role : null;

  return (
    <div className="shell">
      <header className="mast">
        <p className="mark">ShiftPatch</p>
        <div className="mast-row">
          <h1>{session ? session.user.name : "Sign in"}</h1>
          {session ? (
            <button type="button" className="btn" onClick={signOut}>Sign out</button>
          ) : null}
        </div>
        {session ? <p className="role-line">{session.user.role}</p> : (
          <p className="lede">Use your staffing account to claim or publish shifts.</p>
        )}
      </header>
      <NotificationBanner tone={notice?.tone ?? "idle"} message={notice?.message ?? ""} />
      {session?.user.role === "admin" ? (
        <p className="scope-note">Signed in. Staffing actions are not available for this account.</p>
      ) : null}
      {!session ? (
        <form className="login" onSubmit={onLogin}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              data-testid="login-email-input"
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={loginError ? true : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              data-testid="login-password-input"
              type="password"
              autoComplete="current-password"
              value={password}
              aria-invalid={loginError ? true : undefined}
              aria-describedby={loginError ? "login-error" : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {loginError ? <p id="login-error" className="field-error">{loginError}</p> : null}
          <button
            type="submit"
            data-testid="login-submit-button"
            className="btn btn-primary"
            disabled={loginPending}
          >
            {loginPending ? "Signing in" : "Sign in"}
          </button>
        </form>
      ) : null}
      {mode ? (
        <section className="board" aria-busy={list.status === "loading"}>
          <div className="board-bar">
            <h2>{mode === "nurse" ? "Marketplace" : "Your shifts"}</h2>
            <button type="button" className="btn" disabled={list.status === "loading"} onClick={() => void refresh(hold)}>
              Refresh
            </button>
          </div>
          {mode === "agency" ? (
            <button
              type="button"
              data-testid="agency-post-shift-button"
              className="btn btn-primary"
              onClick={() => setCreating((open) => !open)}
            >
              {creating ? "Close form" : "Post shift"}
            </button>
          ) : null}
          {mode === "agency" && creating ? (
            <CreateShiftForm
              pending={pendingKey === "publish"}
              locked={hold}
              onSubmit={(value) => {
                if (!session) return;
                void settleMutation(session, "publish", "Shift published.", (signal) => (
                  createShift(session.token, value, signal)
                ));
              }}
            />
          ) : null}
          {list.status === "loading" ? <p className="state-line">Loading shifts</p> : null}
          {list.loadError ? (
            <div className="state-block">
              <p>{list.loadError}</p>
              <button type="button" className="btn" onClick={() => void refresh(hold)}>Try again</button>
            </div>
          ) : null}
          {list.status === "ready" && list.shifts.length === 0 && !list.loadError ? (
            <p className="state-line">No shifts to show.</p>
          ) : null}
          {list.shifts.length > 0 ? (
            <ul className="cards">
              {list.shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  mode={mode}
                  pending={pendingKey === `claim:${shift.id}` || pendingKey === `cancel:${shift.id}`}
                  locked={hold || (pendingKey !== null && pendingKey !== `claim:${shift.id}` && pendingKey !== `cancel:${shift.id}`)}
                  onClaim={(shiftId) => {
                    if (!session) return;
                    void settleMutation(session, `claim:${shiftId}`, "Shift claimed.", (signal) => (
                      claimShift(session.token, shiftId, signal)
                    ));
                  }}
                  onCancel={(shiftId, reason: CancellationReason) => {
                    if (!session) return;
                    void settleMutation(session, `cancel:${shiftId}`, "Shift reopened.", (signal) => (
                      cancelShift(session.token, shiftId, reason, signal)
                    ));
                  }}
                />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
