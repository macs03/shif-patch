import type { Shift } from "@/lib/domain/types";

export const trialShifts: Shift[] = [
  {
    id: "shift-1",
    agencyId: "agency-a",
    agencyName: "Sunrise Health Staffing",
    role: "RN",
    date: "2026-10-02",
    startTime: "19:00",
    endTime: "07:00",
    status: "open",
    claimedBy: null,
  },
  {
    id: "shift-2",
    agencyId: "agency-a",
    agencyName: "Sunrise Health Staffing",
    role: "LPN",
    date: "2026-10-03",
    startTime: "07:00",
    endTime: "19:00",
    status: "filled",
    claimedBy: "nurse-1",
  },
  {
    id: "shift-3",
    agencyId: "agency-b",
    agencyName: "Metro Care Partners",
    role: "RN",
    date: "2026-10-04",
    startTime: "19:00",
    endTime: "07:00",
    status: "open",
    claimedBy: null,
  },
];
