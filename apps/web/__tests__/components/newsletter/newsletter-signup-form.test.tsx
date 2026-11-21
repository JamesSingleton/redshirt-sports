import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewsletterSignupForm } from "@/components/newsletter/newsletter-signup-form";

function respond(body: unknown) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body)));
}

const typeEmail = (email = "fan@example.test") =>
  userEvent.type(screen.getByLabelText("Email address"), email);
const signUp = () =>
  userEvent.click(screen.getByRole("button", { name: "Sign up" }));

describe("NewsletterSignupForm", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the address and clears it once the link is sent", async () => {
    const fetch = respond({ status: "sent", message: "Check your inbox." });
    render(<NewsletterSignupForm />);
    const input = screen.getByLabelText("Email address");
    await userEvent.type(input, "fan@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Check your inbox.")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(input).not.toHaveAttribute("aria-invalid");
    const [url, init] = fetch.mock.lastCall ?? [];
    expect(url).toBe("/api/newsletter/subscribe");
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
    expect(((init as RequestInit).body as FormData).get("email")).toBe(
      "fan@example.test",
    );
  });

  it("catches a missing or bad address without a round trip", async () => {
    const fetch = respond({});
    render(<NewsletterSignupForm />);
    const input = screen.getByLabelText("Email address");
    await signUp();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Enter a valid email address.",
    );
    expect(input).toHaveFocus();

    await typeEmail("nope");
    await signUp();
    expect(screen.getByRole("status")).toHaveClass("text-destructive");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the address when the server says no", async () => {
    respond({
      status: "error",
      message: "Newsletter signups aren't open yet.",
    });
    render(<NewsletterSignupForm />);
    await typeEmail();
    await signUp();
    expect(
      await screen.findByText("Newsletter signups aren't open yet."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "fan@example.test",
    );
  });

  it("says so when the request never lands", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    render(<NewsletterSignupForm />);
    await typeEmail();
    await signUp();
    expect(
      await screen.findByText(
        "Something went wrong. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("disables the button while it waits", async () => {
    let resolve!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<NewsletterSignupForm />);
    await typeEmail();
    await signUp();
    expect(screen.getByRole("button", { name: "Signing up…" })).toBeDisabled();
    resolve(new Response(JSON.stringify({ status: "sent", message: "Done." })));
    expect(await screen.findByText("Done.")).toBeInTheDocument();
  });

  it("uses light-on-ink colors in the footer", async () => {
    respond({ status: "error", message: "Enter a valid email address." });
    render(<NewsletterSignupForm tone="inverse" />);
    expect(screen.getByLabelText("Email address")).toHaveClass(
      "text-ink-foreground",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(
      await screen.findByText("Enter a valid email address."),
    ).not.toHaveClass("text-destructive");
  });

  describe("confirm status from the URL", () => {
    afterEach(() => window.history.replaceState(null, "", "/"));

    it("is ignored unless the form asks for it", () => {
      window.history.replaceState(null, "", "/?status=confirmed");
      render(<NewsletterSignupForm />);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(window.location.search).toBe("?status=confirmed");
    });

    it("leaves an unknown status alone", () => {
      window.history.replaceState(null, "", "/newsletter?status=bogus");
      render(<NewsletterSignupForm showConfirmStatus />);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(window.location.search).toBe("?status=bogus");
    });

    it("shows an expired link as an error", async () => {
      window.history.replaceState(null, "", "/newsletter?status=invalid");
      render(<NewsletterSignupForm showConfirmStatus />);
      expect(
        await screen.findByText(/That confirm link has expired/),
      ).toHaveClass("text-destructive");
      expect(window.location.search).toBe("");
    });
  });

  it("sends the ticked choices", async () => {
    const fetch = respond({ status: "sent", message: "Done." });
    render(
      <NewsletterSignupForm
        polls={[{ id: "poll-fcs", label: "FCS Top 25" }]}
      />,
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /FCS Top 25 alerts/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /The Week in College Sports/ }),
    );
    await typeEmail();
    await signUp();
    await screen.findByText("Done.");
    const [, init] = fetch.mock.lastCall ?? [];
    const body = (init as RequestInit).body as FormData;
    expect(body.get("choices")).toBe("1");
    expect(body.getAll("poll")).toEqual(["poll-fcs"]);
    expect(body.has("digest")).toBe(false);
  });

  it("asks for at least one email before posting", async () => {
    const fetch = respond({});
    render(
      <NewsletterSignupForm
        polls={[{ id: "poll-fcs", label: "FCS Top 25" }]}
      />,
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /The Week in College Sports/ }),
    );
    await typeEmail();
    await signUp();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Pick at least one email to get.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
