"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { loginRequestSchema } from "@/lib/domain/schemas";
import {
  ApiError,
  cancelShift,
  claimShift,
  createShift,
  listAgency,
  listMarketplace,
  login,
  readAdminDashboard,
  readAudit,
  readCredential,
  submitCredential,
} from "@/lib/client/api";
import type { AuditEvent, CancellationReason, CredentialResponse, SessionUser, Shift } from "@/lib/domain/types";
import { AdminDashboard } from "./AdminDashboard";
import { CreateShiftForm } from "./CreateShiftForm";
import { CredentialForm } from "./CredentialForm";
import { NotificationBanner } from "./NotificationBanner";
import { ShiftCard } from "./ShiftCard";
import { AppHeader } from "./AppHeader";
import { Loader } from "./Loader";
import { IconClose, IconEye, IconEyeOff, IconRefresh } from "./UiIcons";

type NursePanel = "marketplace" | "credential";

type Session = { token: string; user: SessionUser };
type Notice = { tone: "success" | "error"; message: string } | null;
type ListState = { status: "loading" | "ready" | "error"; shifts: Shift[]; loadError: string | null };
type CredentialState = { status: "idle" | "loading" | "ready" | "error"; view: CredentialResponse | null; error: string | null };
type AdminState = {
  status: "idle" | "loading" | "ready" | "error";
  shifts: Shift[];
  metrics: { open: number; filled: number } | null;
  error: string | null;
  events: AuditEvent[];
  auditStatus: "idle" | "loading" | "ready" | "error";
  auditError: string | null;
};

const idleCredential: CredentialState = { status: "idle", view: null, error: null };
const idleAdmin: AdminState = {
  status: "idle",
  shifts: [],
  metrics: null,
  error: null,
  events: [],
  auditStatus: "idle",
  auditError: null,
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [nursePanel, setNursePanel] = useState<NursePanel>("marketplace");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [list, setList] = useState<ListState>({ status: "ready", shifts: [], loadError: null });
  const [creating, setCreating] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hold, setHold] = useState(false);
  const [credential, setCredential] = useState<CredentialState>(idleCredential);
  const [credentialPending, setCredentialPending] = useState(false);
  const [admin, setAdmin] = useState<AdminState>(idleAdmin);

  const epoch = useRef(0);
  const postDialog = useRef<HTMLDialogElement>(null);
  const ignoreDialogClose = useRef(false);
  const inflight = useRef(new Set<AbortController>());
  const pendingRef = useRef<string | null>(null);
  const holdRef = useRef(false);
  const loginLock = useRef(false);
  const credentialLock = useRef(false);
  const shiftReads = useRef(0);
  const credentialReads = useRef(0);
  const adminReads = useRef(0);

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
    setShowPassword(false);
    setNursePanel("marketplace");
    setLoginError("");
    setList({ status: "ready", shifts: [], loadError: null });
    setCredential(idleCredential);
    setCredentialPending(false);
    credentialLock.current = false;
    setAdmin(idleAdmin);
    setNotice({ tone: "error", message: EXPIRED });
  }, [invalidate, setHoldBoth]);

  const load = useCallback(async (
    target: Session,
    signal: AbortSignal,
    snap: number,
    releaseHold: boolean,
  ): Promise<boolean> => {
    const ticket = ++shiftReads.current;
    try {
      const shifts = target.user.role === "agency"
        ? await listAgency(target.token, target.user.id, signal)
        : await listMarketplace(target.token, signal);
      if (epoch.current !== snap || shiftReads.current !== ticket) return false;
      setList({ status: "ready", shifts, loadError: null });
      if (releaseHold) setHoldBoth(false);
      return true;
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap || shiftReads.current !== ticket) return false;
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

  const loadCredential = useCallback(async (target: Session, signal: AbortSignal, snap: number) => {
    const ticket = ++credentialReads.current;
    try {
      const view = await readCredential(target.token, signal);
      if (epoch.current !== snap || credentialReads.current !== ticket) return;
      setCredential({ status: "ready", view, error: null });
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap || credentialReads.current !== ticket) return;
      if (error instanceof ApiError && error.status === 401) {
        expire();
        return;
      }
      const message = error instanceof ApiError ? error.message : "Credential could not be loaded.";
      setCredential((prev) => (
        prev.view
          ? { status: "ready", view: prev.view, error: message }
          : { status: "error", view: null, error: message }
      ));
    }
  }, [expire]);

  const loadAdmin = useCallback(async (target: Session, signal: AbortSignal, snap: number) => {
    const ticket = ++adminReads.current;
    const dashboardPromise = readAdminDashboard(target.token, signal);
    const auditPromise = readAudit(target.token, signal);
    const [dashboard, audit] = await Promise.allSettled([dashboardPromise, auditPromise]);
    if (isAbort(dashboard.status === "rejected" ? dashboard.reason : null) || epoch.current !== snap || adminReads.current !== ticket) return;
    if (dashboard.status === "rejected" && dashboard.reason instanceof ApiError && dashboard.reason.status === 401) {
      expire();
      return;
    }
    if (audit.status === "rejected" && audit.reason instanceof ApiError && audit.reason.status === 401) {
      expire();
      return;
    }
    if (epoch.current !== snap || adminReads.current !== ticket) return;
    setAdmin((prev) => {
      const next = { ...prev };
      if (dashboard.status === "fulfilled") {
        next.status = "ready";
        next.shifts = dashboard.value.shifts;
        next.metrics = dashboard.value.metrics;
        next.error = null;
      } else if (!(dashboard.reason instanceof DOMException && dashboard.reason.name === "AbortError")) {
        const message = dashboard.reason instanceof ApiError ? dashboard.reason.message : "Shifts could not be loaded.";
        if (prev.metrics) {
          next.status = "ready";
          next.error = message;
        } else {
          next.status = "error";
          next.shifts = [];
          next.metrics = null;
          next.error = message;
        }
      }
      if (audit.status === "fulfilled") {
        next.auditStatus = "ready";
        next.events = audit.value;
        next.auditError = null;
      } else if (!(audit.reason instanceof DOMException && audit.reason.name === "AbortError")) {
        const message = audit.reason instanceof ApiError ? audit.reason.message : "Audit could not be loaded.";
        if (prev.auditStatus === "ready") {
          next.auditError = message;
        } else {
          next.auditStatus = "error";
          next.events = [];
          next.auditError = message;
        }
      }
      return next;
    });
  }, [expire]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const requests = inflight.current;
    requests.add(controller);
    const snap = epoch.current;
    if (session.user.role === "admin") void loadAdmin(session, controller.signal, snap);
    else {
      void load(session, controller.signal, snap, false);
      if (session.user.role === "nurse") void loadCredential(session, controller.signal, snap);
    }
    return () => {
      controller.abort();
      requests.delete(controller);
    };
  }, [session, load, loadAdmin, loadCredential]);

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
    if (!session) return;
    if (session.user.role === "admin") {
      const controller = new AbortController();
      inflight.current.add(controller);
      await loadAdmin(session, controller.signal, epoch.current);
      inflight.current.delete(controller);
      return;
    }
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
      if (key === "publish") setCreating(false);
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
      setShowPassword(false);
      setNursePanel("marketplace");
      setNotice(null);
      setList(result.user.role === "admin"
        ? { status: "ready", shifts: [], loadError: null }
        : { status: "loading", shifts: [], loadError: null });
      setCredential(result.user.role === "nurse"
        ? { status: "loading", view: null, error: null }
        : idleCredential);
      setAdmin(result.user.role === "admin"
        ? { ...idleAdmin, status: "loading", auditStatus: "loading" }
        : idleAdmin);
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
    setShowPassword(false);
    setNursePanel("marketplace");
    setLoginError("");
    setNotice(null);
    setList({ status: "ready", shifts: [], loadError: null });
    setCredential(idleCredential);
    setCredentialPending(false);
    credentialLock.current = false;
    setAdmin(idleAdmin);
  }

  async function onCredential(document: File, expiresOn: string) {
    if (!session || credentialLock.current) return;
    credentialLock.current = true;
    setCredentialPending(true);
    const controller = new AbortController();
    inflight.current.add(controller);
    const snap = epoch.current;
    try {
      const view = await submitCredential(session.token, document, expiresOn, controller.signal);
      if (epoch.current !== snap) return;
      credentialReads.current += 1;
      setCredential({ status: "ready", view, error: null });
      setNotice({
        tone: view.status === "expired" ? "error" : "success",
        message: view.status === "expired"
          ? "Credential saved. It is expired and cannot be used to claim a shift."
          : "Credential saved.",
      });
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap) return;
      if (error instanceof ApiError && error.status === 401) {
        expire();
        return;
      }
      const message = error instanceof ApiError ? error.message : "Credential could not be saved.";
      setNotice({ tone: "error", message });
    } finally {
      inflight.current.delete(controller);
      if (epoch.current === snap) {
        credentialLock.current = false;
        setCredentialPending(false);
      }
    }
  }

  useEffect(() => {
    const dialog = postDialog.current;
    if (!creating || !dialog) return;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    }
    return () => {
      ignoreDialogClose.current = true;
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      ignoreDialogClose.current = false;
    };
  }, [creating]);

  const mode = session?.user.role === "nurse" || session?.user.role === "agency" ? session.user.role : null;

  if (!session) {
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <header className="mast">
            <p className="mark">ShiftPatch</p>
            <h1>Sign in</h1>
            <p className="lede">Use your staffing account to claim or publish shifts.</p>
          </header>
          <NotificationBanner tone={notice?.tone ?? "idle"} message={notice?.message ?? ""} />
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
              <div className="field-label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="btn btn-icon btn-icon-muted"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  onClick={() => setShowPassword((open) => !open)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <input
                id="login-password"
                data-testid="login-password-input"
                type={showPassword ? "text" : "password"}
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
        </div>
      </div>
    );
  }

  const showShiftBoard =
    mode === "agency" || (session.user.role === "nurse" && nursePanel === "marketplace");

  return (
    <div className="app-frame">
      <AppHeader name={session.user.name} role={session.user.role} onSignOut={signOut} />
      <div className={session.user.role === "admin" ? "shell shell-wide" : "shell"}>
      <NotificationBanner tone={notice?.tone ?? "idle"} message={notice?.message ?? ""} />
      {session.user.role === "nurse" ? (
        <div className="role-tabs" role="tablist" aria-label="Nurse">
          <button
            type="button"
            role="tab"
            id="nurse-tab-marketplace"
            className="role-tab"
            aria-selected={nursePanel === "marketplace"}
            aria-controls="nurse-panel-marketplace"
            onClick={() => setNursePanel("marketplace")}
          >
            Marketplace
          </button>
          <button
            type="button"
            role="tab"
            id="nurse-tab-credential"
            className="role-tab"
            aria-selected={nursePanel === "credential"}
            aria-controls="nurse-panel-credential"
            onClick={() => setNursePanel("credential")}
          >
            Credential
          </button>
        </div>
      ) : null}
      {session.user.role === "admin" ? (
        <AdminDashboard
          shifts={admin.shifts}
          metrics={admin.metrics}
          shiftState={admin.status === "idle" ? "loading" : admin.status}
          shiftError={admin.error}
          events={admin.events}
          auditState={admin.auditStatus === "idle" ? "loading" : admin.auditStatus}
          auditError={admin.auditError}
          onRefresh={() => void refresh(false)}
        />
      ) : null}
      {session.user.role === "nurse" && nursePanel === "credential" ? (
        <div
          id="nurse-panel-credential"
          role="tabpanel"
          aria-labelledby="nurse-tab-credential"
        >
          <CredentialForm
            view={credential.view}
            loadError={credential.error}
            pending={credentialPending}
            onSubmit={(document, expiresOn) => void onCredential(document, expiresOn)}
          />
        </div>
      ) : null}
      {showShiftBoard && mode ? (
        <section
          id={session.user.role === "nurse" ? "nurse-panel-marketplace" : undefined}
          role={session.user.role === "nurse" ? "tabpanel" : undefined}
          aria-labelledby={session.user.role === "nurse" ? "nurse-tab-marketplace" : undefined}
          className="board"
          aria-busy={list.status === "loading"}
        >
          <div className="board-bar">
            <h2>{mode === "nurse" ? "Marketplace" : "Your shifts"}</h2>
            <button
              type="button"
              className={`btn btn-icon btn-icon-muted${list.status === "loading" ? " btn-icon--spin" : ""}`}
              disabled={list.status === "loading"}
              onClick={() => void refresh(hold)}
              aria-label="Refresh"
              title="Refresh"
            >
              <IconRefresh />
            </button>
          </div>
          {mode === "agency" ? (
            <button
              type="button"
              data-testid="agency-post-shift-button"
              className="btn btn-primary"
              onClick={() => setCreating(true)}
            >
              Post shift
            </button>
          ) : null}
          {mode === "agency" && creating
            ? createPortal(
              <dialog
                ref={postDialog}
                className="modal"
                aria-labelledby="post-shift-title"
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  const inside = event.clientX >= box.left && event.clientX <= box.right
                    && event.clientY >= box.top && event.clientY <= box.bottom;
                  if (!inside) event.currentTarget.close();
                }}
                onClose={() => {
                  if (!ignoreDialogClose.current) setCreating(false);
                }}
              >
                <div className="modal-bar">
                  <h2 id="post-shift-title">Post shift</h2>
                  <button
                    type="button"
                    className="btn btn-icon btn-icon-muted"
                    aria-label="Close"
                    title="Close"
                    onClick={() => {
                      const dialog = postDialog.current;
                      if (!dialog) return;
                      if (typeof dialog.close === "function") dialog.close();
                      else {
                        dialog.removeAttribute("open");
                        setCreating(false);
                      }
                    }}
                  >
                    <IconClose />
                  </button>
                </div>
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
              </dialog>,
              document.body,
            )
            : null}
          {list.status === "loading" ? <Loader label="Loading shifts" /> : null}
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
    </div>
  );
}
