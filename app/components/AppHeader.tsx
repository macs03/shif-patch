import { IconSignOut } from "./UiIcons";

export function AppHeader({
  name,
  role,
  onSignOut,
}: {
  name: string;
  role: string;
  onSignOut: () => void;
}) {
  return (
    <div className="app-header-bar">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-logo" aria-hidden>SP</span>
          <p className="app-header-title">ShiftPatch</p>
        </div>
        <div className="app-header-user">
          <h1 className="app-header-name">{name}</h1>
          <p className="role-badge">{role}</p>
          <button
            type="button"
            className="btn btn-icon btn-icon-muted"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <IconSignOut />
          </button>
        </div>
      </header>
    </div>
  );
}
