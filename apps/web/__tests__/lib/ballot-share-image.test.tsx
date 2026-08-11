const { mockUrlFor } = vi.hoisted(() => ({
  mockUrlFor: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlFor: mockUrlFor,
}));

import { render, screen } from "@testing-library/react";

import { BallotShareImage, schoolLogoUrl } from "@/lib/ballot-share-image";

describe("schoolLogoUrl", () => {
  beforeEach(() => {
    mockUrlFor.mockReset();
  });

  it("returns null for missing image", () => {
    expect(schoolLogoUrl(null)).toBeNull();
    expect(schoolLogoUrl(undefined)).toBeNull();
  });

  it("returns string images and treats empty string as null", () => {
    expect(schoolLogoUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
    expect(schoolLogoUrl("")).toBeNull();
  });

  it("builds a Sanity CDN URL for object images", () => {
    mockUrlFor.mockReturnValue({
      width: () => ({
        height: () => ({
          url: () => "https://cdn.sanity.io/logo.webp",
        }),
      }),
    });

    expect(schoolLogoUrl({ asset: { _ref: "image-abc" } })).toBe(
      "https://cdn.sanity.io/logo.webp",
    );
  });

  it("returns null when urlFor throws", () => {
    mockUrlFor.mockImplementation(() => {
      throw new Error("bad image");
    });
    expect(schoolLogoUrl({ asset: { _ref: "bad" } })).toBeNull();
  });
});

describe("BallotShareImage", () => {
  beforeEach(() => {
    mockUrlFor.mockReset().mockReturnValue({
      width: () => ({
        height: () => ({
          url: () => "https://cdn.sanity.io/alabama.png",
        }),
      }),
    });
  });

  it("renders headline, voter, organization, logos, and fallbacks", () => {
    const { container } = render(
      <BallotShareImage
        division="fcs"
        week={5}
        voterName="Jane Doe"
        organization="Example Media"
        entries={[
          {
            rank: 1,
            schoolId: "db-1",
            teamId: "school-1",
            shortName: "Alabama",
            abbreviation: "ALA",
            name: "Alabama",
            image: { asset: { _ref: "image-1" } },
          },
          {
            rank: 2,
            schoolId: "db-2",
            teamId: "school-2",
            shortName: null,
            abbreviation: "UGA",
            name: "Georgia",
            image: null,
          },
          {
            rank: 3,
            schoolId: "db-3",
            teamId: "school-3",
            shortName: null,
            abbreviation: null,
            name: null,
            image: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("My FCS Top 25 — Week 5")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe · Example Media/)).toBeInTheDocument();
    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
    expect(screen.getByText("Top 25 Ballot")).toBeInTheDocument();
    expect(screen.getByText("redshirtsports.com")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Alabama")).toBeInTheDocument();
    expect(container.querySelectorAll("img").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UGA").length).toBeGreaterThan(0);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("omits organization separator when organization is null", () => {
    render(
      <BallotShareImage
        division="fbs"
        week={1}
        voterName="Solo Voter"
        organization={null}
        entries={[
          {
            rank: 1,
            schoolId: "db-1",
            teamId: "school-1",
            shortName: null,
            abbreviation: null,
            name: "Only Name",
            image: "",
          },
        ]}
      />,
    );

    expect(screen.getByText("Solo Voter")).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    expect(screen.getByText("Only Name")).toBeInTheDocument();
    expect(screen.getByText("Only")).toBeInTheDocument();
  });
});
