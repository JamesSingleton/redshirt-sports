import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "@/components/search-bar";

const { mockPush, mockFetch } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockFetch },
}));

const posts = [
  { _id: "post-1", title: "Alabama Preview", slug: "alabama-preview" },
  { _id: "post-2", title: "Alabama Recap", slug: "alabama-recap" },
];

function field() {
  return screen.getByRole("combobox", { name: "Search articles" });
}

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockFetch.mockReset();
  });

  it("suggests articles as links and offers a full search", async () => {
    mockFetch.mockResolvedValue(posts);
    const user = userEvent.setup();
    render(<SearchBar placeholder="Find articles" />);

    await user.type(field(), "alabama");

    const list = await screen.findByRole("listbox");
    const option = await within(list).findByRole("option", {
      name: "Alabama Preview",
    });
    expect(option).toHaveAttribute("href", "/alabama-preview");
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), {
      q: "alabama",
    });
    expect(
      screen.getByRole("link", { name: /Search for “alabama”/ }),
    ).toHaveAttribute("href", "/search?q=alabama");
  });

  it("searches for the text when Enter is pressed with nothing highlighted", async () => {
    mockFetch.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(field(), "  bowl games {Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=bowl%20games");
  });

  it("does nothing for an empty search", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(field(), "   {Enter}");

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("says when nothing matches, including when the search fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("down"));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(field(), "zzz");
    expect(
      await screen.findByText("No articles found for “zzz”"),
    ).toBeVisible();

    await user.type(field(), "q");
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("No articles found for “zzzq”"),
    ).toBeVisible();
  });

  it("starts over after a suggestion is chosen", async () => {
    mockFetch.mockResolvedValue(posts);
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(field(), "alabama");
    await screen.findByRole("option", { name: "Alabama Recap" });
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(field()).toHaveValue("");
  });

  it("clears the field", async () => {
    mockFetch.mockResolvedValue(posts);
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(field(), "alabama");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
  });
});
