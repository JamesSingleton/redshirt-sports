import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockSubmit, mockPublic } = vi.hoisted(() => ({
  mockSubmit: vi.fn(),
  mockPublic: vi.fn(),
}));

vi.mock("@/actions/submit-portal-move", () => ({
  submitPortalMove: mockSubmit,
}));
vi.mock("@/lib/portal-data", () => ({ portalIsPublic: mockPublic }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import SubmitPortalMovePage, {
  metadata,
} from "@/app/transfer-portal/submit/page";
import { SubmitForm } from "@/components/portal/submit-form";

describe("report a move form", () => {
  afterEach(() => vi.clearAllMocks());

  it("labels every field and marks the optional ones", () => {
    render(<SubmitForm />);
    for (const label of [
      "First name",
      "Last name",
      "Sport",
      "Current school",
      "The move",
      "You are",
      "Your name",
      "Your email",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/Position/)).not.toBeRequired();
    // Players paste their NCAA ID out of habit; the form asks them not to.
    expect(
      screen.getByText(/Please don't include your NCAA ID/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Anything else/)).toHaveAttribute(
      "aria-describedby",
      "submit-note-hint",
    );
    expect(screen.getByLabelText(/^Link/)).toHaveAttribute(
      "aria-describedby",
      "submit-link-hint",
    );
    expect(
      screen.getByRole("option", { name: "Football" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "A parent or guardian" }),
    ).toBeInTheDocument();
    // The honeypot is out of reach for people and assistive tech.
    const trap = document.querySelector('input[name="website"]')!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap.closest("[aria-hidden]")).not.toBeNull();
  });

  it("shows field errors, wired for screen readers, and keeps what was typed", async () => {
    mockSubmit.mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { submitterEmail: "Enter a valid email address." },
      values: { submitterEmail: "nope", playerFirstName: "Test" },
    });
    render(<SubmitForm />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send to the editors" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Please fix the highlighted fields.");
    await waitFor(() => expect(alert).toHaveFocus());
    const email = screen.getByLabelText("Your email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute(
      "aria-describedby",
      "submit-submitterEmail-error",
    );
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(email).toHaveValue("nope");
    expect(screen.getByLabelText("First name")).toHaveValue("Test");
  });

  it("thanks them once it's sent", async () => {
    mockSubmit.mockResolvedValue({
      status: "sent",
      message: "Thanks. An editor will review this.",
    });
    render(<SubmitForm />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send to the editors" }),
    );
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Thanks. An editor will review this.");
    await waitFor(() => expect(status).toHaveFocus());
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("report a move page", () => {
  it("is a real 404 while the portal is hidden", () => {
    mockPublic.mockReturnValue(false);
    expect(() => SubmitPortalMovePage()).toThrow("NEXT_NOT_FOUND");
  });

  it("explains that an editor reviews everything", () => {
    mockPublic.mockReturnValue(true);
    render(SubmitPortalMovePage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Report a move" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/An editor checks every submission/),
    ).toBeInTheDocument();
    expect(metadata).toMatchObject({
      title: "Report a Transfer Portal Move",
      alternates: { canonical: "/transfer-portal/submit" },
      robots: { index: false, follow: false },
    });
  });
});
