import { render, screen, waitFor } from "@testing-library/react";

import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import { ShiftListHarness } from "@/lib/testing/ShiftListHarness";

describe("ShiftListHarness", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders shift-list-item for each shift from GET /api/shifts", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ shifts: trialShifts }),
    } as Response);

    render(<ShiftListHarness />);

    await waitFor(() => {
      expect(screen.getAllByTestId("shift-list-item")).toHaveLength(3);
    });
    expect(screen.getByText("shift-1")).toBeInTheDocument();
    expect(screen.getByText("shift-3")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/shifts");
  });

  it("does not render a shift list when the response body is invalid", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ shifts: [{ id: "bad", status: "open", claimedBy: "nurse-1" }] }),
    } as Response);

    render(<ShiftListHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("shift-list-error")).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId("shift-list-item")).toHaveLength(0);
  });
});
