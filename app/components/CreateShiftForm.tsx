"use client";

import { useState } from "react";

import { createShiftRequestSchema } from "@/lib/domain/schemas";
import type { CreateShiftRequest, ShiftRole } from "@/lib/domain/types";

type Errors = Partial<Record<"role" | "date" | "startTime" | "endTime", string>>;

const empty = { role: "" as ShiftRole | "", date: "", startTime: "", endTime: "" };

export function CreateShiftForm({
  pending,
  locked,
  onSubmit,
}: {
  pending: boolean;
  locked: boolean;
  onSubmit: (value: CreateShiftRequest) => void;
}) {
  const [value, setValue] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});

  function validate(next: typeof value): Errors {
    const found: Errors = {};
    if (next.role !== "RN" && next.role !== "LPN") found.role = "Choose RN or LPN.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next.date)) found.date = "Enter a real date as YYYY-MM-DD.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.startTime)) found.startTime = "Enter a start time as HH:mm.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.endTime)) found.endTime = "Enter an end time as HH:mm.";
    if (!found.startTime && !found.endTime && next.startTime === next.endTime) {
      found.endTime = "Start and end must differ. An earlier end time is an overnight shift.";
    }
    if (Object.keys(found).length === 0 && !createShiftRequestSchema.safeParse(next).success) {
      found.date = "Enter a real date as YYYY-MM-DD.";
    }
    return found;
  }

  return (
    <form
      className="create-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || locked) return;
        const found = validate(value);
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        onSubmit(value as CreateShiftRequest);
      }}
    >
      <div className="field">
        <label htmlFor="shift-role">Role</label>
        <select
          id="shift-role"
          value={value.role}
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={errors.role ? "shift-role-error" : undefined}
          onChange={(event) => setValue({ ...value, role: event.target.value as ShiftRole | "" })}
        >
          <option value="">Select role</option>
          <option value="RN">RN</option>
          <option value="LPN">LPN</option>
        </select>
        {errors.role ? <p id="shift-role-error">{errors.role}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="shift-date">Date</label>
        <input
          id="shift-date"
          type="date"
          value={value.date}
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={errors.date ? "shift-date-error" : undefined}
          onChange={(event) => setValue({ ...value, date: event.target.value })}
        />
        {errors.date ? <p id="shift-date-error">{errors.date}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="shift-start">Start</label>
        <input
          id="shift-start"
          type="time"
          value={value.startTime}
          aria-invalid={errors.startTime ? true : undefined}
          aria-describedby={errors.startTime ? "shift-start-error" : undefined}
          onChange={(event) => setValue({ ...value, startTime: event.target.value })}
        />
        {errors.startTime ? <p id="shift-start-error">{errors.startTime}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="shift-end">End</label>
        <input
          id="shift-end"
          type="time"
          value={value.endTime}
          aria-invalid={errors.endTime ? true : undefined}
          aria-describedby={errors.endTime ? "shift-end-error" : undefined}
          onChange={(event) => setValue({ ...value, endTime: event.target.value })}
        />
        {errors.endTime ? <p id="shift-end-error">{errors.endTime}</p> : null}
      </div>
      <button
        type="submit"
        data-testid="agency-post-shift-submit-button"
        className="btn btn-primary"
        disabled={pending || locked}
      >
        {pending ? "Publishing" : "Publish shift"}
      </button>
    </form>
  );
}
