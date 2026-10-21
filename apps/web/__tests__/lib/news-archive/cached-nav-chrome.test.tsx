import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

const { mockSanityFetchPage } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
}));

vi.mock("@/lib/news-archive/cached-global-navigation", () => ({
  getCachedGlobalNavigation: (...args: unknown[]) =>
    mockSanityFetchPage(...args),
}));

vi.mock("@/components/news/college-news-archive-filters", () => ({
  CollegeNewsArchiveFilters: () => <div data-testid="college-filters" />,
}));

vi.mock("@/components/news/news-archive-filters", () => ({
  NewsArchiveFilters: () => <div data-testid="sport-filters" />,
}));

vi.mock("@/components/news/division-conference-picker", () => ({
  DivisionConferencePicker: () => <div data-testid="picker" />,
}));

import {
  CachedCollegeNewsFiltersInner,
  CachedFolderConferencePicker,
  CachedFolderNewsFiltersBelowHeaderInner,
  CachedSportNewsFiltersInner,
  FolderConferencePickerSlot,
  FolderNewsFiltersBelowHeaderSlot,
} from "@/lib/news-archive/cached-nav-chrome";

describe("cached news archive nav chrome", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchPage.mockResolvedValue({
      data: [
        {
          slug: "football",
          groupings: [
            {
              slug: "fbs",
              name: "FBS",
              conferences: [{ slug: "sec", name: "SEC", shortName: "SEC" }],
            },
          ],
        },
      ],
    });
  });

  it("renders college filters after navigation loads", async () => {
    const tree = await CachedCollegeNewsFiltersInner({
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("college-filters")).toBeInTheDocument();
  });

  it("renders sport filters after navigation loads", async () => {
    const tree = await CachedSportNewsFiltersInner({
      sportSlug: "football",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("sport-filters")).toBeInTheDocument();
  });

  it("renders the conference picker after navigation loads", async () => {
    const tree = await CachedFolderConferencePicker({
      sportSlug: "football",
      divisionSlug: "fbs",
      divisionLabel: "FBS",
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("renders folder filters below the header after navigation loads", async () => {
    const tree = await CachedFolderNewsFiltersBelowHeaderInner({
      sportSlug: "football",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("sport-filters")).toBeInTheDocument();
  });

  it("shows a conference picker skeleton while loading", () => {
    mockSanityFetchPage.mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <FolderConferencePickerSlot
        sportSlug="football"
        divisionSlug="fbs"
        divisionLabel="FBS"
        perspective="published"
        stega={false}
      />,
    );
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows folder filter skeleton while loading", () => {
    mockSanityFetchPage.mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <FolderNewsFiltersBelowHeaderSlot
        sportSlug="football"
        filterParams={{}}
        perspective="published"
        stega={false}
      />,
    );
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });
});
