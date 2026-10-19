import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { trialShifts } from "@/__tests__/fixtures/trial-shifts";
import { CreateShiftForm } from "@/app/components/CreateShiftForm";
import { ShiftCard } from "@/app/components/ShiftCard";
import { ConfirmationDialog } from "@/app/components/ConfirmationDialog";
import { PostShiftDialog } from "@/app/components/PostShiftDialog";

const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    queueMicrotask(() => this.dispatchEvent(new Event("close")));
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  HTMLDialogElement.prototype.close = originalClose;
});

it.each(["nurse", "agency"] as const)("requires confirmation before a %s shift action", (mode) => {
  const claim = jest.fn();
  const cancel = jest.fn();
  const shift = trialShifts[mode === "nurse" ? 0 : 1];
  render(<ul><ShiftCard shift={shift} mode={mode} pending={false} locked={false} onClaim={claim} onCancel={cancel} /></ul>);
  if (mode === "agency") fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "no-show" } });
  const button = screen.getByRole("button", { name: mode === "nurse" ? "Claim shift" : "Reopen shift" });
  fireEvent.click(button);
  expect(claim).not.toHaveBeenCalled();
  expect(cancel).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog");
  const message = dialog.textContent ?? "";
  expect(dialog).toHaveAccessibleDescription();
  expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
  for (const detail of [shift.agencyName, shift.role, shift.date, shift.startTime, shift.endTime]) expect(message).toContain(detail);
  expect(message).toContain(mode === "nurse" ? "claim" : "no-show");
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  if (mode === "agency") expect(screen.getByLabelText("Reason")).toHaveValue("no-show");
  fireEvent.click(button);
  fireEvent.click(screen.getByRole("button", { name: mode === "nurse" ? "Confirm claim" : "Confirm reopening" }));
  if (mode === "nurse") {
    expect(claim).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledWith(shift.id);
  } else {
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(shift.id, "no-show");
  }
});

it.each([
  { mode: "nurse" as const, pending: true, locked: false },
  { mode: "nurse" as const, pending: false, locked: true },
  { mode: "agency" as const, pending: true, locked: false },
  { mode: "agency" as const, pending: false, locked: true },
])("does not confirm a blocked $mode action (pending=$pending, locked=$locked)", ({ mode, pending, locked }) => {
  const action = jest.fn();
  render(<ul><ShiftCard shift={trialShifts[mode === "nurse" ? 0 : 1]} mode={mode} pending={pending} locked={locked} onClaim={action} onCancel={action} /></ul>);
  const button = screen.getByRole("button");
  fireEvent.click(button);
  if (mode === "agency") fireEvent.submit(button.closest("form")!);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();
});

it("validates before confirming publication and preserves a cancelled draft", () => {
  const submit = jest.fn();
  const view = render(<CreateShiftForm pending={false} locked={false} onSubmit={submit} />);
  const button = screen.getByRole("button", { name: "Publish shift" });
  fireEvent.click(button);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Role"), { target: { value: "RN" } });
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-10-20" } });
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "19:00" } });
  fireEvent.change(screen.getByLabelText("End"), { target: { value: "07:00" } });
  fireEvent.click(button);
  expect(submit).not.toHaveBeenCalled();
  for (const detail of ["publish", "RN", "2026-10-20", "19:00", "07:00"]) expect(screen.getByRole("dialog")).toHaveTextContent(detail);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByLabelText("Role")).toHaveValue("RN");
  expect(screen.getByLabelText("Date")).toHaveValue("2026-10-20");
  expect(screen.getByLabelText("Start")).toHaveValue("19:00");
  expect(screen.getByLabelText("End")).toHaveValue("07:00");
  fireEvent.click(button);
  fireEvent.click(screen.getByRole("button", { name: "Confirm publication" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledWith({ role: "RN", date: "2026-10-20", startTime: "19:00", endTime: "07:00" });
  for (const flags of [{ pending: true, locked: false }, { pending: false, locked: true }]) {
    view.rerender(<CreateShiftForm {...flags} onSubmit={submit} />);
    fireEvent.submit(button.closest("form")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(1);
  }
});

it("dismisses on native cancel without accepting", () => {
  const accept = jest.fn();
  const close = jest.fn();
  render(<ConfirmationDialog title="Claim this shift?" confirmLabel="Confirm claim" disabled={false} onConfirm={accept} onClose={close}>Shift details</ConfirmationDialog>);
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(accept).not.toHaveBeenCalled();
});

it("accepts at most once under Strict Mode", () => {
  const accept = jest.fn();
  render(<StrictMode><ConfirmationDialog title="Claim this shift?" confirmLabel="Confirm claim" disabled={false} onConfirm={accept} onClose={jest.fn()}>Shift details</ConfirmationDialog></StrictMode>);
  const button = screen.getByRole("button", { name: "Confirm claim" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(accept).toHaveBeenCalledTimes(1);
});

it("does not accept a claim when the shift becomes filled while confirmation is open", () => {
  const claim = jest.fn();
  const props = { mode: "nurse" as const, pending: false, locked: false, onClaim: claim, onCancel: jest.fn() };
  const view = render(<ul><ShiftCard {...props} shift={trialShifts[0]} /></ul>);
  fireEvent.click(screen.getByRole("button", { name: "Claim shift" }));
  view.rerender(<ul><ShiftCard {...props} shift={{ ...trialShifts[0], status: "filled", claimedBy: "nurse-9" }} /></ul>);
  expect(screen.getByRole("button", { name: "Confirm claim" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm claim" }));
  expect(claim).not.toHaveBeenCalled();
});

it.each(["Cancel", "Close", "Escape", "Backdrop"])("keeps the publishing draft when confirmation is dismissed with %s", async (dismissal) => {
  const submit = jest.fn();
  const close = jest.fn();
  render(<StrictMode><PostShiftDialog pending={false} locked={false} onSubmit={submit} onClose={close} /></StrictMode>);
  fireEvent.change(screen.getByLabelText("Role"), { target: { value: "RN" } });
  fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-10-20" } });
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "19:00" } });
  fireEvent.change(screen.getByLabelText("End"), { target: { value: "07:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish shift" }));
  const confirmation = screen.getByRole("dialog", { name: "Publish this shift?" });
  expect(confirmation.parentElement).toBe(document.body);
  await act(async () => {
    if (dismissal === "Escape") fireEvent(confirmation, new Event("cancel", { cancelable: true }));
    else if (dismissal === "Backdrop") fireEvent.click(confirmation, { clientX: -1, clientY: -1 });
    else fireEvent.click(within(confirmation).getByRole("button", { name: dismissal }));
  });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Publish this shift?" })).not.toBeInTheDocument());
  expect(screen.getByRole("dialog", { name: "Post shift" })).toBeInTheDocument();
  expect(screen.getByLabelText("Date")).toHaveValue("2026-10-20");
  expect(close).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
