"use client";

import { useEffect, useState } from "react";

import { shiftsResponseSchema } from "@/lib/domain/schemas";

export function ShiftListHarness() {
  const [shiftIds, setShiftIds] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/shifts")
      .then((response) => response.json())
      .then((body) => {
        if (!active) return;
        const parsed = shiftsResponseSchema.safeParse(body);
        if (!parsed.success) {
          setInvalid(true);
          return;
        }
        setShiftIds(parsed.data.shifts.map((shift) => shift.id));
      })
      .catch(() => {
        if (active) setInvalid(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (invalid) {
    return <p data-testid="shift-list-error">Could not load shifts</p>;
  }

  return (
    <ul>
      {shiftIds.map((id) => (
        <li key={id} data-testid="shift-list-item">{id}</li>
      ))}
    </ul>
  );
}
