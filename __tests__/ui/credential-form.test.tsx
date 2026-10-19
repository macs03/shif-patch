import { fireEvent, render, screen } from "@testing-library/react";

import { CredentialForm } from "@/app/components/CredentialForm";

it("associates credential errors with the invalid field and preserves valid submission", () => {
  const submit = jest.fn();
  render(<CredentialForm view={{ credential: null, status: "missing" }} loadError={null} pending={false} onSubmit={submit} />);
  fireEvent.click(screen.getByRole("button", { name: "Save credential" }));
  const document = screen.getByLabelText("Document");
  const date = screen.getByLabelText("Expiration date");
  expect(document).toHaveAttribute("aria-invalid", "true");
  expect(document).toHaveAccessibleDescription("Choose a PDF, JPEG, or PNG.");
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a PDF, JPEG, or PNG.");
  expect(submit).not.toHaveBeenCalled();

  const file = new File(["%PDF-"], "license.pdf", { type: "application/pdf" });
  fireEvent.change(document, { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: "Save credential" }));
  expect(document).not.toHaveAttribute("aria-invalid");
  expect(date).toHaveAttribute("aria-invalid", "true");
  expect(date).toHaveAccessibleDescription("Enter a real expiration date.");
  fireEvent.change(date, { target: { value: "2020-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Save credential" }));
  expect(submit).toHaveBeenCalledWith(file, "2020-01-01");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(date).not.toHaveAttribute("aria-invalid");
});
