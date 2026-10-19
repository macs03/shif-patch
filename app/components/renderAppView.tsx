"use client";

import type { ComponentProps, ReactNode } from "react";

import type { SessionUser } from "@/lib/domain/types";
import { AdminDashboard } from "./AdminDashboard";
import { AgencyDashboard } from "./AgencyDashboard";
import { AppHeader } from "./AppHeader";
import { LoginView } from "./LoginView";
import { NotificationBanner } from "./NotificationBanner";
import { NurseDashboard } from "./NurseDashboard";

export function renderAppView({
  user,
  notice,
  onSignOut,
  login,
  nurse,
  agency,
  admin,
}: {
  user: SessionUser | null;
  notice: ComponentProps<typeof LoginView>["notice"];
  onSignOut: () => void;
  login: ComponentProps<typeof LoginView>;
  nurse: ComponentProps<typeof NurseDashboard>;
  agency: ComponentProps<typeof AgencyDashboard>;
  admin: ComponentProps<typeof AdminDashboard>;
}): ReactNode {
  if (user === null) return <LoginView {...login} />;

  let roleView: ReactNode;
  switch (user.role) {
    case "nurse":
      roleView = <NurseDashboard {...nurse} />;
      break;
    case "agency":
      roleView = <AgencyDashboard {...agency} />;
      break;
    case "admin":
      roleView = <AdminDashboard {...admin} />;
      break;
  }

  return (
    <div className="app-frame">
      <AppHeader name={user.name} role={user.role} onSignOut={onSignOut} />
      <div className={user.role === "admin" ? "shell shell-wide" : "shell"}>
        <NotificationBanner tone={notice?.tone ?? "idle"} message={notice?.message ?? ""} />
        {roleView}
      </div>
    </div>
  );
}
