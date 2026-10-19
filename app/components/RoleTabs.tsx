"use client";

import { useRef, type KeyboardEvent } from "react";

export function RoleTabs<T extends string>({
  label,
  idPrefix,
  tabs,
  value,
  onChange,
}: {
  label: string;
  idPrefix: string;
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
      case "ArrowRight": next = (index + 1) % tabs.length; break;
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    onChange(tabs[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div className="role-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          ref={(button) => { buttons.current[index] = button; }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.value}`}
          className="role-tab"
          aria-selected={value === tab.value}
          aria-controls={`${idPrefix}-panel-${tab.value}`}
          tabIndex={value === tab.value ? 0 : -1}
          onKeyDown={(event) => move(event, index)}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
