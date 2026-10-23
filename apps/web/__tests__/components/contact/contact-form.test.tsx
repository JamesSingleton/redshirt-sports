import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

vi.mock("@redshirt-sports/ui/components/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <div>
      <span data-testid="topic-value">{value}</span>
      <button type="button" onClick={() => onValueChange?.("Correction")}>
        Pick correction
      </button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { ContactForm } from "@/components/contact/contact-form";

describe("ContactForm", () => {
  it("opens mailto without article URL when the field is empty", async () => {
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return "";
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });

    const user = userEvent.setup();
    render(<ContactForm contactEmail="hello@example.com" />);
    await user.type(screen.getByLabelText(/Name/i), "Jane");
    await user.type(
      screen.getByLabelText(/Email address/i),
      "jane@example.com",
    );
    await user.type(screen.getByLabelText(/^Message/i), "Hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(hrefSetter).toHaveBeenCalledWith(
      expect.not.stringContaining("Article%20URL"),
    );
  });

  it("opens mailto with encoded fields on submit", async () => {
    const user = userEvent.setup();
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        assign: hrefSetter,
        get href() {
          return "";
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });

    render(<ContactForm contactEmail="hello@example.com" />);

    await user.type(screen.getByLabelText(/Name/i), "Jane Doe");
    await user.type(
      screen.getByLabelText(/Email address/i),
      "jane@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Pick correction" }));
    await user.type(
      screen.getByLabelText(/Article URL/i),
      "https://example.com/story",
    );
    await user.type(screen.getByLabelText(/^Message/i), "Please fix this.");

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining("mailto:hello@example.com"),
    );
    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining("subject=Correction"),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Ready to send");
  });
});
