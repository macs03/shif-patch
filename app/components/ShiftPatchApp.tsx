"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent
} from "react";

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
  submitCredential
} from "@/lib/client/api";
import type {
  AuditEvent,
  CredentialResponse,
  SessionUser,
  Shift
} from "@/lib/domain/types";
import type { NursePanel } from "./NurseDashboard";
import { renderAppView } from "@/app/components/renderAppView";

type Session = { token: string; user: SessionUser };
type Notice = { tone: "success" | "error"; message: string } | null;
type ListState = {
  status: "loading" | "ready" | "error";
  shifts: Shift[];
  loadError: string | null;
};
type CredentialState = {
  view: CredentialResponse | null;
  error: string | null;
};
type AdminState = {
  status: "idle" | "loading" | "ready" | "error";
  shifts: Shift[];
  metrics: { open: number; filled: number } | null;
  error: string | null;
  events: AuditEvent[];
  auditStatus: "idle" | "loading" | "ready" | "error";
  auditError: string | null;
};

const idleCredential: CredentialState = { view: null, error: null };
const idleAdmin: AdminState = {
  status: "idle",
  shifts: [],
  metrics: null,
  error: null,
  events: [],
  auditStatus: "idle",
  auditError: null
};

const EXPIRED = "Your session has expired. Sign in again.";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function upsert(shifts: Shift[], shift: Shift): Shift[] {
  const next = shifts.some(item => item.id === shift.id)
    ? shifts.map(item => (item.id === shift.id ? shift : item))
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
  const [list, setList] = useState<ListState>({
    status: "ready",
    shifts: [],
    loadError: null
  });
  const [creating, setCreating] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hold, setHold] = useState(false);
  const [credential, setCredential] = useState<CredentialState>(idleCredential);
  const [credentialPending, setCredentialPending] = useState(false);
  const [admin, setAdmin] = useState<AdminState>(idleAdmin);

  const epoch = useRef(0);
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

  const resetSession = useCallback(() => {
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
  }, [invalidate, setHoldBoth]);

  const expire = useCallback(() => {
    resetSession();
    setNotice({ tone: "error", message: EXPIRED });
  }, [resetSession]);

  const load = useCallback(
    async (
      target: Session,
      signal: AbortSignal,
      snap: number,
      releaseHold: boolean
    ): Promise<boolean> => {
      const ticket = ++shiftReads.current;
      try {
        const shifts =
          target.user.role === "agency"
            ? await listAgency(target.token, target.user.id, signal)
            : await listMarketplace(target.token, signal);
        if (epoch.current !== snap || shiftReads.current !== ticket)
          return false;
        setList({ status: "ready", shifts, loadError: null });
        if (releaseHold) setHoldBoth(false);
        return true;
      } catch (error) {
        if (
          isAbort(error) ||
          epoch.current !== snap ||
          shiftReads.current !== ticket
        )
          return false;
        if (error instanceof ApiError && error.status === 401) {
          expire();
          return false;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Shifts could not be loaded.";
        setList(prev =>
          prev.shifts.length > 0
            ? { status: "ready", shifts: prev.shifts, loadError: message }
            : { status: "error", shifts: [], loadError: message }
        );
        return false;
      }
    },
    [expire, setHoldBoth]
  );

  const loadCredential = useCallback(
    async (target: Session, signal: AbortSignal, snap: number) => {
      const ticket = ++credentialReads.current;
      try {
        const view = await readCredential(target.token, signal);
        if (epoch.current !== snap || credentialReads.current !== ticket)
          return;
        setCredential({ view, error: null });
      } catch (error) {
        if (
          isAbort(error) ||
          epoch.current !== snap ||
          credentialReads.current !== ticket
        )
          return;
        if (error instanceof ApiError && error.status === 401) {
          expire();
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Credential could not be loaded.";
        setCredential(prev => ({ view: prev.view, error: message }));
      }
    },
    [expire]
  );

  const loadAdmin = useCallback(
    async (target: Session, signal: AbortSignal, snap: number) => {
      const ticket = ++adminReads.current;
      const dashboardPromise = readAdminDashboard(target.token, signal);
      const auditPromise = readAudit(target.token, signal);
      const [dashboard, audit] = await Promise.allSettled([
        dashboardPromise,
        auditPromise
      ]);
      if (
        isAbort(dashboard.status === "rejected" ? dashboard.reason : null) ||
        epoch.current !== snap ||
        adminReads.current !== ticket
      )
        return;
      if (
        dashboard.status === "rejected" &&
        dashboard.reason instanceof ApiError &&
        dashboard.reason.status === 401
      ) {
        expire();
        return;
      }
      if (
        audit.status === "rejected" &&
        audit.reason instanceof ApiError &&
        audit.reason.status === 401
      ) {
        expire();
        return;
      }
      if (epoch.current !== snap || adminReads.current !== ticket) return;
      setAdmin(prev => {
        const next = { ...prev };
        if (dashboard.status === "fulfilled") {
          next.status = "ready";
          next.shifts = dashboard.value.shifts;
          next.metrics = dashboard.value.metrics;
          next.error = null;
        } else if (
          !(
            dashboard.reason instanceof DOMException &&
            dashboard.reason.name === "AbortError"
          )
        ) {
          const message =
            dashboard.reason instanceof ApiError
              ? dashboard.reason.message
              : "Shifts could not be loaded.";
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
        } else if (
          !(
            audit.reason instanceof DOMException &&
            audit.reason.name === "AbortError"
          )
        ) {
          const message =
            audit.reason instanceof ApiError
              ? audit.reason.message
              : "Audit could not be loaded.";
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
    },
    [expire]
  );

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const requests = inflight.current;
    requests.add(controller);
    const snap = epoch.current;
    if (session.user.role === "admin")
      void loadAdmin(session, controller.signal, snap);
    else {
      void load(session, controller.signal, snap, false);
      if (session.user.role === "nurse")
        void loadCredential(session, controller.signal, snap);
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
      if (controller.signal === controllerSignal)
        inflight.current.delete(controller);
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
    work: (signal: AbortSignal) => Promise<Shift>
  ) {
    const request = begin(key);
    if (!request) return;
    try {
      const shift = await work(request.signal);
      if (epoch.current !== request.snap) return;
      setList(prev => ({
        status: "ready",
        shifts: upsert(prev.shifts, shift),
        loadError: null
      }));
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
        const reconciled = await load(
          current,
          request.signal,
          request.snap,
          true
        );
        if (epoch.current !== request.snap) return;
        setNotice({
          tone: "error",
          message: reconciled
            ? "The outcome is uncertain. The list is up to date and you can try again."
            : "The outcome is uncertain. Refresh the list before trying again."
        });
        return;
      }
      const message =
        error instanceof ApiError ? error.message : "The request failed.";
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
      const result = await login(
        parsed.data.email,
        parsed.data.password,
        controller.signal
      );
      if (epoch.current !== snap) return;
      setPassword("");
      setShowPassword(false);
      setNursePanel("marketplace");
      setNotice(null);
      setList(
        result.user.role === "admin"
          ? { status: "ready", shifts: [], loadError: null }
          : { status: "loading", shifts: [], loadError: null }
      );
      setCredential(idleCredential);
      setAdmin(
        result.user.role === "admin"
          ? { ...idleAdmin, status: "loading", auditStatus: "loading" }
          : idleAdmin
      );
      setSession({ token: result.token, user: result.user });
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap) return;
      const message =
        error instanceof ApiError
          ? error.message
          : "The service could not be reached.";
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
    resetSession();
    setNotice(null);
  }

  async function onCredential(document: File, expiresOn: string) {
    if (!session || credentialLock.current) return;
    credentialLock.current = true;
    setCredentialPending(true);
    const controller = new AbortController();
    inflight.current.add(controller);
    const snap = epoch.current;
    try {
      const view = await submitCredential(
        session.token,
        document,
        expiresOn,
        controller.signal
      );
      if (epoch.current !== snap) return;
      credentialReads.current += 1;
      setCredential({ view, error: null });
      setNotice({
        tone: view.status === "expired" ? "error" : "success",
        message:
          view.status === "expired"
            ? "Credential saved. It is expired and cannot be used to claim a shift."
            : "Credential saved."
      });
    } catch (error) {
      if (isAbort(error) || epoch.current !== snap) return;
      if (error instanceof ApiError && error.status === 401) {
        expire();
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : "Credential could not be saved.";
      setNotice({ tone: "error", message });
    } finally {
      inflight.current.delete(controller);
      if (epoch.current === snap) {
        credentialLock.current = false;
        setCredentialPending(false);
      }
    }
  }

  // eslint-disable-next-line react-hooks/refs -- selector forwards handlers; it does not call them
  return renderAppView({
    user: session?.user ?? null,
    notice,
    onSignOut: signOut,
    login: {
      email,
      password,
      showPassword,
      loginError,
      loginPending,
      notice,
      onEmailChange: setEmail,
      onPasswordChange: setPassword,
      onTogglePassword: () => setShowPassword(open => !open),
      onSubmit: onLogin
    },
    nurse: {
      panel: nursePanel,
      onPanelChange: setNursePanel,
      status: list.status,
      loadError: list.loadError,
      shifts: list.shifts,
      pendingKey,
      hold,
      onRefresh: () => void refresh(hold),
      onClaim: shiftId => {
        if (!session) return;
        void settleMutation(
          session,
          `claim:${shiftId}`,
          "Shift claimed.",
          signal => claimShift(session.token, shiftId, signal)
        );
      },
      onCancel: (shiftId, reason) => {
        if (!session) return;
        void settleMutation(
          session,
          `cancel:${shiftId}`,
          "Shift reopened.",
          signal => cancelShift(session.token, shiftId, reason, signal)
        );
      },
      credentialView: credential.view,
      credentialError: credential.error,
      credentialPending,
      onCredentialSubmit: (document, expiresOn) =>
        void onCredential(document, expiresOn)
    },
    agency: {
      status: list.status,
      loadError: list.loadError,
      shifts: list.shifts,
      pendingKey,
      hold,
      creating,
      onOpenCreate: () => setCreating(true),
      onCloseCreate: () => setCreating(false),
      onRefresh: () => void refresh(hold),
      onPublish: value => {
        if (!session) return;
        void settleMutation(session, "publish", "Shift published.", signal =>
          createShift(session.token, value, signal)
        );
      },
      onCancel: (shiftId, reason) => {
        if (!session) return;
        void settleMutation(
          session,
          `cancel:${shiftId}`,
          "Shift reopened.",
          signal => cancelShift(session.token, shiftId, reason, signal)
        );
      }
    },
    admin: {
      shifts: admin.shifts,
      metrics: admin.metrics,
      shiftState: admin.status === "idle" ? "loading" : admin.status,
      shiftError: admin.error,
      events: admin.events,
      auditState: admin.auditStatus === "idle" ? "loading" : admin.auditStatus,
      auditError: admin.auditError,
      onRefresh: () => void refresh(false)
    }
  });
}
