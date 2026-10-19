import { IconSpinner } from "./UiIcons";

export function Loader({ label }: { label: string }) {
  return (
    <p className="state-line loader" role="status">
      <IconSpinner className="loader-spin" />
      {label}
    </p>
  );
}
