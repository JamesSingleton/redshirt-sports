import { render } from "@testing-library/react";

import { NewsArchiveFilterBarPlaceholder } from "@/components/news/news-archive-filter-bar-placeholder";

const fields: {
  label: string;
  onValueChange: (value: string) => void;
}[] = [];

vi.mock("@/components/news/news-archive-filter-select", () => ({
  NewsArchiveFilterSelect: (props: {
    label: string;
    onValueChange: (value: string) => void;
  }) => {
    fields.push(props);
    return <div data-field={props.label} />;
  },
}));

function labels(variant: "college" | "sport" | "folder") {
  fields.length = 0;
  const { container } = render(
    <NewsArchiveFilterBarPlaceholder variant={variant} />,
  );
  return {
    container,
    labels: fields.map((field) => field.label),
  };
}

describe("NewsArchiveFilterBarPlaceholder", () => {
  it("has the same fields as each variant of the real bar", () => {
    expect(labels("college").labels).toEqual([
      "Sport",
      "Division",
      "Conference",
      "Type",
      "Sort",
    ]);
    expect(labels("sport").labels).toEqual([
      "Division",
      "Conference",
      "Type",
      "Sort",
    ]);
    expect(labels("folder").labels).toEqual(["Type", "Sort"]);
  });

  it("is inert and hidden from assistive tech, and ignores changes", () => {
    const { container } = labels("college");
    const root = container.firstElementChild;
    expect(root).toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-hidden", "true");
    for (const field of fields) {
      expect(() => field.onValueChange("anything")).not.toThrow();
    }
  });
});
