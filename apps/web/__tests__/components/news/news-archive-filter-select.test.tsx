import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewsArchiveFilterSelect } from "@/components/news/news-archive-filter-select";

vi.mock("@redshirt-sports/ui/components/select", async () => {
  const React = await import("react");
  return {
    Select: ({
      children,
      onValueChange,
      value,
      defaultValue,
    }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
      value?: string;
      defaultValue?: string;
    }) => (
      <div data-testid="select" data-value={value ?? defaultValue}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{
                  onValueChange?: (v: string) => void;
                }>,
                {
                  onValueChange,
                },
              )
            : child,
        )}
      </div>
    ),
    SelectTrigger: ({
      children,
      id,
    }: {
      children: React.ReactNode;
      id?: string;
    }) => (
      <button type="button" id={id}>
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
    SelectContent: ({
      children,
      onValueChange,
    }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
    }) => (
      <div>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{ onSelect?: () => void }>,
                {
                  onSelect: () => {
                    const value = (child.props as { value: string }).value;
                    onValueChange?.(value);
                  },
                },
              )
            : child,
        )}
      </div>
    ),
    SelectItem: ({
      children,
      value,
      onSelect,
    }: {
      children: React.ReactNode;
      value: string;
      onSelect?: () => void;
    }) => (
      <button type="button" onClick={onSelect}>
        {children} ({value})
      </button>
    ),
  };
});

describe("NewsArchiveFilterSelect", () => {
  it("renders label and maps the all option to an empty value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <NewsArchiveFilterSelect
        id="news-f-type"
        label="Type"
        value=""
        onValueChange={onValueChange}
        allLabel="All types"
        options={[{ value: "News", label: "News" }]}
      />,
    );

    expect(screen.getByText("Type")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /News \(News\)/ }));
    expect(onValueChange).toHaveBeenCalledWith("News");

    await user.click(screen.getByRole("button", { name: /All types/ }));
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("omits the all option when includeAllOption is false", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <NewsArchiveFilterSelect
        id="news-f-sort"
        label="Sort"
        value="newest"
        onValueChange={onValueChange}
        allLabel="Newest first"
        includeAllOption={false}
        options={[
          { value: "newest", label: "Newest first" },
          { value: "oldest", label: "Oldest first" },
        ]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /All types/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Oldest first/ }));
    expect(onValueChange).toHaveBeenCalledWith("oldest");
  });

  it("supports uncontrolled navigation selects", () => {
    render(
      <NewsArchiveFilterSelect
        id="news-f-div"
        label="Division"
        defaultValue="fbs"
        onValueChange={vi.fn()}
        allLabel="All divisions"
        options={[{ value: "fbs", label: "FBS" }]}
      />,
    );

    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "fbs");
  });

  it("defaults uncontrolled selects to the all option", () => {
    render(
      <NewsArchiveFilterSelect
        id="news-f-div"
        label="Division"
        onValueChange={vi.fn()}
        allLabel="All divisions"
        options={[{ value: "fbs", label: "FBS" }]}
      />,
    );

    expect(screen.getByTestId("select")).toHaveAttribute(
      "data-value",
      "__all__",
    );
  });
});
