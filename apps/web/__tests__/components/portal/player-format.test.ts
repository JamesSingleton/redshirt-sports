import {
  currentEnrollment,
  enrollmentYears,
  eventText,
  moveCard,
  playerJsonLd,
  playerPageDescription,
  playerPageTitle,
  sportsByActivity,
} from "@/components/portal/player-format";
import {
  playerData,
  playerDoc,
  playerSport,
  recruitment,
} from "../../helpers/portal-player";

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));

const data = playerData();

describe("player sports and schools", () => {
  it("puts the sport with the latest move first", () => {
    const quiet = playerSport({
      sportSlug: "mens-basketball",
      recruitments: [],
    });
    const busy = playerSport();
    expect(
      sportsByActivity(playerDoc({ sports: [quiet, busy] })).map(
        (sport) => sport.sportSlug,
      ),
    ).toEqual(["football", "mens-basketball"]);
  });

  it("finds the current school and writes years", () => {
    const sport = playerSport({
      enrollments: [
        { schoolId: "montana", startYear: 2022, endYear: 2024 },
        { schoolId: "boise", startYear: 2024 },
      ],
    });
    expect(currentEnrollment(sport)).toEqual({
      schoolId: "boise",
      startYear: 2024,
    });
    expect(currentEnrollment(playerSport({ enrollments: [] }))).toBeNull();
    expect(enrollmentYears({ startYear: 2024 })).toBe("2024–");
    expect(enrollmentYears({ startYear: 2022, endYear: 2024 })).toBe("2022–24");
    expect(enrollmentYears({ startYear: 2024, endYear: 2024 })).toBe("2024");
  });
});

describe("portal history wording", () => {
  it("says what each move was", () => {
    const at = { id: 1, occurredAt: "2026-01-02", superseded: false };
    expect(eventText(data, { ...at, type: "entered" })).toBe(
      "Entered the transfer portal",
    );
    expect(
      eventText(data, { ...at, type: "committed", schoolId: "boise" }),
    ).toBe("Committed to Boise State University");
    expect(
      eventText(data, { ...at, type: "decommitted", schoolId: "montana" }),
    ).toBe("Decommitted from Montana");
    expect(
      eventText(data, { ...at, type: "signed", schoolName: "Carroll College" }),
    ).toBe("Signed with Carroll College");
    expect(eventText(data, { ...at, type: "enrolled" })).toBe(
      "Enrolled at an undisclosed school",
    );
    expect(eventText(data, { ...at, type: "withdrew" })).toBe(
      "Withdrew from the transfer portal",
    );
    expect(eventText(data, { ...at, type: "offered" })).toBe("Offered");
  });

  it("draws the header's previous → next school card", () => {
    const move = (overrides: Parameters<typeof recruitment>[0]) =>
      moveCard(data, recruitment(overrides));
    expect(move({})).toMatchObject({
      labels: ["Previous school", "New school"],
      from: { key: "montana" },
      to: { kind: "school", view: { key: "boise-state" } },
      status: "committed",
      statusLine: "Committed Jan 5, 2026",
      details: ["Entered Jan 2, 2026", "Undergraduate transfer"],
    });
    expect(move({ status: "entered" })).toMatchObject({
      labels: ["Previous school", "Next school"],
      to: { kind: "undecided" },
      statusLine: "Entered Jan 5, 2026",
      // The status line already says when they entered.
      details: ["Undergraduate transfer"],
    });
    expect(move({ isGradTransfer: true }).details[1]).toBe("Graduate transfer");
    // Committed with no school on record still reads as undecided.
    expect(move({ destination: undefined }).to).toEqual({ kind: "undecided" });
    expect(move({ status: "withdrawn" })).toMatchObject({
      to: { kind: "returning", name: "Montana" },
      statusLine: "Withdrew Jan 5, 2026",
    });
    expect(move({ status: "withdrawn", origin: {} })).toMatchObject({
      from: null,
      to: { kind: "returning", name: "previous school" },
    });
  });
});

describe("player SEO", () => {
  it("titles the page by name and sport", () => {
    expect(playerPageTitle(data.doc, playerSport())).toBe(
      "Jalen Brooks College Football Transfer Portal Profile",
    );
    expect(playerPageTitle(data.doc, undefined)).toBe(
      "Jalen Brooks Transfer Portal Profile",
    );
  });

  it("describes the latest move", () => {
    expect(playerPageDescription(data)).toBe(
      "Jalen Brooks, a QB from Sentinel (Missoula, MT), committed to Boise State University from Montana in the 2026 transfer portal. Full portal history, offers, and college career.",
    );
    const with_ = (status: Parameters<typeof recruitment>[0]) =>
      playerPageDescription(
        playerData({
          doc: playerDoc({
            highSchoolName: undefined,
            hometownCity: undefined,
            hometownState: undefined,
            sports: [
              playerSport({
                position: undefined,
                recruitments: [recruitment(status)],
              }),
            ],
          }),
        }),
      );
    expect(with_({ status: "entered" })).toBe(
      "Jalen Brooks, entered the 2026 transfer portal from Montana. Full portal history, offers, and college career.",
    );
    expect(with_({ status: "withdrawn" })).toContain(
      "withdrew from the 2026 transfer portal and returned to Montana",
    );
    expect(
      playerPageDescription(
        playerData({
          doc: playerDoc({ sports: [playerSport({ recruitments: [] })] }),
        }),
      ),
    ).toBe(
      "Jalen Brooks, a QB from Sentinel (Missoula, MT): transfer portal history, offers, and college career on Redshirt Sports.",
    );
  });

  it("describes the player as a Person on a ProfilePage", () => {
    const sport = playerSport({
      enrollments: [
        { schoolId: "montana", startYear: 2022, endYear: 2024 },
        { schoolId: "gone", startYear: 2024, endYear: 2025 },
        { startYear: 2025, endYear: 2025 },
        { schoolId: "boise", startYear: 2025 },
      ],
    });
    const ld = playerJsonLd(
      playerData({ doc: playerDoc({ sports: [sport] }) }),
      "/players/jalen-brooks-100000",
      [
        { name: "Home", path: "/" },
        { name: "Jalen Brooks", path: "/players/jalen-brooks-100000" },
      ],
    );
    expect(ld).toMatchObject({
      "@type": "ProfilePage",
      url: "https://redshirtsports.com/players/jalen-brooks-100000",
      name: "Jalen Brooks College Football Transfer Portal Profile",
      dateModified: "2026-01-06T00:00:00.000Z",
      mainEntity: {
        "@type": "Person",
        name: "Jalen Brooks",
        givenName: "Jalen",
        familyName: "Brooks",
        homeLocation: { "@type": "Place", name: "Missoula, MT" },
        height: { value: 75, unitCode: "INH" },
        weight: { value: 215, unitCode: "LBR" },
        jobTitle: "QB",
        alumniOf: [
          { "@type": "EducationalOrganization", name: "Sentinel" },
          { "@type": "EducationalOrganization", name: "Montana" },
          { "@type": "EducationalOrganization", name: "Unknown school" },
        ],
        memberOf: {
          "@type": "SportsTeam",
          name: "Boise State University Football",
        },
      },
      breadcrumb: {
        itemListElement: [
          { position: 1, name: "Home", item: "https://redshirtsports.com" },
          {
            position: 2,
            item: "https://redshirtsports.com/players/jalen-brooks-100000",
          },
        ],
      },
    });

    // Nothing optional to say: no optional fields.
    const bare = playerJsonLd(
      playerData({
        doc: playerDoc({
          highSchoolName: undefined,
          hometownCity: undefined,
          hometownState: undefined,
          sports: [],
        }),
      }),
      "/players/jalen-brooks-100000",
      [],
    );
    expect(bare.mainEntity).toEqual({
      "@type": "Person",
      "@id": "https://redshirtsports.com/players/jalen-brooks-100000#person",
      name: "Jalen Brooks",
      givenName: "Jalen",
      familyName: "Brooks",
      url: "https://redshirtsports.com/players/jalen-brooks-100000",
    });
  });
});
