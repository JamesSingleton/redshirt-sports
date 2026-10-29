import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MethodologySectionNav } from "@/components/rankings/methodology-section-nav";

const sections = [
  { id: "how", label: "How the poll works" },
  { id: "points", label: "Points" },
  { id: "missing", label: "Missing" },
] as const;

describe("MethodologySectionNav", () => {
  const tops = new Map<string, number>();
  const original = HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    tops.clear();
    HTMLElement.prototype.getBoundingClientRect = function rect() {
      const top = tops.get(this.id);
      if (top == null) return original.call(this);
      return {
        top,
        bottom: top,
        left: 0,
        right: 0,
        width: 0,
        height: 10,
        x: 0,
        y: top,
        toJSON() {
          return {};
        },
      } as DOMRect;
    };
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = original;
  });

  it("highlights the section that has reached the top of the page", async () => {
    const user = userEvent.setup();
    tops.set("how", 200);
    tops.set("points", 400);
    const view = render(
      <div>
        <MethodologySectionNav sections={sections} />
        <section id="how" />
        <section id="points" />
      </div>,
    );

    expect(
      screen.getByRole("link", { name: "How the poll works" }),
    ).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Points" })).not.toHaveAttribute(
      "aria-current",
    );

    tops.set("how", -40);
    tops.set("points", 40);
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByRole("link", { name: "Points" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    await user.click(screen.getByRole("link", { name: "How the poll works" }));
    expect(
      screen.getByRole("link", { name: "How the poll works" }),
    ).toHaveAttribute("aria-current", "location");

    view.unmount();
  });

  it("renders nothing to highlight when there are no sections", () => {
    const view = render(<MethodologySectionNav sections={[]} />);
    expect(
      screen.getByRole("navigation", { name: "On this page" }),
    ).toBeEmptyDOMElement();
    view.unmount();
  });
});
