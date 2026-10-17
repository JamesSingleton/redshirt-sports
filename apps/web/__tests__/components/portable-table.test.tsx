import { render, screen, within } from "@testing-library/react";

import { PortableTable } from "@/components/portable-table";

type MarkDef = { _key: string; _type: string; [key: string]: unknown };

function cell(
  key: string,
  text?: string,
  options: { marks?: string[]; markDefs?: MarkDef[] } = {},
) {
  return {
    _key: key,
    _type: "cell" as const,
    ...(text === undefined
      ? {}
      : {
          value: [
            {
              _key: `${key}-block`,
              _type: "block" as const,
              children: [
                {
                  _key: `${key}-span`,
                  _type: "span" as const,
                  marks: options.marks ?? [],
                  text,
                },
              ],
              markDefs: options.markDefs ?? [],
              style: "normal",
            },
          ],
        }),
  };
}

describe("PortableTable", () => {
  it("renders nothing when the table has no rows", () => {
    const { container } = render(<PortableTable value={{ _type: "table" }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when rows is an empty array", () => {
    const { container } = render(
      <PortableTable value={{ _type: "table", rows: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders header and body rows with Portable Text cell content", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          headerRows: 2,
          rows: [
            { _key: "header-1", cells: [cell("header-team", "Team")] },
            { _key: "header-2" },
            {
              _key: "body-1",
              cells: [cell("body-team", "Texas Lutheran"), cell("empty")],
            },
            { _key: "body-2" },
          ],
        }}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Team" })).toHaveAttribute(
      "scope",
      "col",
    );
    expect(screen.getByRole("cell", { name: "Texas Lutheran" })).toBeVisible();
    expect(container.querySelector("th p, td p")).toBeNull();
  });

  it("renders every row in the body when headerRows is absent", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          rows: [{ _key: "body", cells: [cell("school", "Hendrix")] }],
        }}
      />,
    );

    expect(container.querySelector("thead")).toBeNull();
    expect(screen.getByRole("cell", { name: "Hendrix" })).toBeVisible();
  });

  it("splits rows between thead and tbody using headerRows", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          headerRows: 1,
          rows: [
            {
              _key: "h",
              cells: [cell("h-team", "Team"), cell("h-rank", "Rank")],
            },
            {
              _key: "b1",
              cells: [cell("b1-team", "Alabama"), cell("b1-rank", "1")],
            },
            {
              _key: "b2",
              cells: [cell("b2-team", "Georgia"), cell("b2-rank", "2")],
            },
          ],
        }}
      />,
    );

    const thead = container.querySelector("thead") as HTMLElement;
    const tbody = container.querySelector("tbody") as HTMLElement;

    expect(within(thead).getAllByRole("row")).toHaveLength(1);
    expect(within(thead).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(tbody).getAllByRole("row")).toHaveLength(2);
    expect(within(tbody).getByRole("cell", { name: "Georgia" })).toBeVisible();
    expect(within(tbody).queryByRole("columnheader")).toBeNull();
  });

  it("renders header cells without a value as empty headers", () => {
    render(
      <PortableTable
        value={{
          _type: "table",
          headerRows: 1,
          rows: [
            { _key: "h", cells: [cell("h-empty"), cell("h-team", "Team")] },
            { _key: "b", cells: [cell("b-1", "x"), cell("b-2", "y")] },
          ],
        }}
      />,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Team" })).toBeVisible();
  });

  it("treats a negative headerRows as no header", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          headerRows: -2,
          rows: [{ _key: "body", cells: [cell("school", "Hendrix")] }],
        }}
      />,
    );

    expect(container.querySelector("thead")).toBeNull();
    expect(screen.getByRole("cell", { name: "Hendrix" })).toBeVisible();
  });

  it("renders only a header when headerRows covers every row", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          headerRows: 5,
          rows: [{ _key: "h", cells: [cell("h-team", "Team")] }],
        }}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Team" })).toBeVisible();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });

  it("renders marks inside cells", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          rows: [
            {
              _key: "r1",
              cells: [cell("c1", "1.47 M*", { marks: ["strong"] })],
            },
          ],
        }}
      />,
    );

    const strong = container.querySelector("td strong");
    expect(strong).toHaveTextContent("1.47 M*");
    expect(container.querySelector("td p")).toBeNull();
  });

  it("renders link annotations inside cells", () => {
    render(
      <PortableTable
        value={{
          _type: "table",
          rows: [
            {
              _key: "r1",
              cells: [
                cell("c1", "Recap", {
                  marks: ["m1"],
                  markDefs: [
                    {
                      _key: "m1",
                      _type: "link",
                      href: "https://example.com/recap",
                    },
                  ],
                }),
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Recap" })).toHaveAttribute(
      "href",
      "https://example.com/recap",
    );
  });

  it("wraps the table in a scrollable, non-prose container", () => {
    const { container } = render(
      <PortableTable
        value={{
          _type: "table",
          rows: [{ _key: "body", cells: [cell("school", "Hendrix")] }],
        }}
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("not-prose", "overflow-x-auto");
    expect(within(wrapper).getByRole("table")).toBeInTheDocument();
  });
});
