"use client";

import type { FormEvent } from "react";

import { NotificationBanner } from "./NotificationBanner";
import { IconEye, IconEyeOff } from "./UiIcons";

export function LoginView({
  email,
  password,
  showPassword,
  loginError,
  loginPending,
  notice,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loginError: string;
  loginPending: boolean;
  notice: { tone: "success" | "error"; message: string } | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="auth-gate">
      <div className="auth-card">
        <header className="mast">
          <p className="mark">ShiftPatch</p>
          <h1>Sign in</h1>
          <p className="lede">Use your staffing account to claim or publish shifts.</p>
        </header>
        <NotificationBanner tone={notice?.tone ?? "idle"} message={notice?.message ?? ""} />
        <form className="login" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              data-testid="login-email-input"
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={loginError ? true : undefined}
              onChange={(event) => onEmailChange(event.target.value)}
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
                onClick={onTogglePassword}
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
              onChange={(event) => onPasswordChange(event.target.value)}
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
