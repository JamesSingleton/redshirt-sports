import type { ReactElement } from "react";
import { render } from "react-email";

const { mockSince, mockRankings, mockWeeks, mockBroadcast } = vi.hoisted(
  () => ({
    mockSince: vi.fn(),
    mockRankings: vi.fn(),
    mockWeeks: vi.fn(),
    mockBroadcast: vi.fn(),
  }),
);

vi.mock("@redshirt-sports/db/queries", () => ({
  listPollWeeksPublishedSince: mockSince,
  getFinalRankingsForWeekAndYear: mockRankings,
  getWeeksThatHaveVotes: mockWeeks,
}));
vi.mock("@/lib/newsletter/broadcast", () => ({
  broadcastOnce: mockBroadcast,
  RESEND_UNSUBSCRIBE_URL: "{{{RESEND_UNSUBSCRIBE_URL}}}",
}));
vi.mock("@/lib/newsletter/email-logos", () => ({
  emailLogos: async () => ({ onLight: null, onDark: null }),
}));

import type { NewsletterConfig } from "@/lib/newsletter/config";
import {
  othersReceivingVotes,
  sendPollAlerts,
  toAlertTeams,
} from "@/lib/newsletter/poll-alerts";

const NOW = new Date("2026-11-16T15:10:00.000Z");
const config = {} as NewsletterConfig;

function team(
  id: string,
  rank: number | null,
  points: number,
  extra: Record<string, unknown> = {},
) {
  return {
    _id: id,
    rank,
    _points: points,
    name: `${id} University`,
    shortName: id,
    abbreviation: id.toUpperCase(),
    slug: id,
    image: null,
    firstPlaceVotes: 0,
    isTie: false,
    ...extra,
  };
}

const FCS_WEEK = {
  pollId: "poll-fcs",
  pollSlug: "fcs",
  pollName: "FCS Top 25",
  sportSlug: "football",
  sportName: "Football",
  weekId: "week-11",
  year: 2026,
  week: 11,
};

type BroadcastArgs = {
  key: string;
  ttlSeconds: number;
  topic: { name: string };
  content: () => Promise<{
    name: string;
    subject: string;
    previewText: string;
    react: ReactElement;
  }>;
};

describe("toAlertTeams", () => {
  const current = [
    team("ndsu", 1, 625, { firstPlaceVotes: 25 }),
    team("sdsu", 2, 590),
    team("mercer", 3, 500, { isTie: true }),
    team("montana", 26, 41),
  ];

  it("keeps the 25 and marks who moved against last week", () => {
    const previous = [
      team("sdsu", 1, 600),
      team("ndsu", 2, 590),
      team("x", 3, 1),
    ];
    expect(toAlertTeams(current, previous)).toEqual([
      {
        id: "ndsu",
        rank: 1,
        isTie: false,
        name: "ndsu",
        points: 625,
        firstPlaceVotes: 25,
        movement: { kind: "up", delta: 1 },
      },
      expect.objectContaining({
        id: "sdsu",
        movement: { kind: "down", delta: 1 },
      }),
      expect.objectContaining({
        id: "mercer",
        isTie: true,
        movement: { kind: "new" },
      }),
    ]);
  });

  it("shows no movement in a season's first poll", () => {
    expect(toAlertTeams(current, null).map((t) => t.movement)).toEqual([
      { kind: "same" },
      { kind: "same" },
      { kind: "same" },
    ]);
  });
});

describe("othersReceivingVotes", () => {
  it("lists teams outside the 25 with points, most first", () => {
    expect(
      othersReceivingVotes([
        team("ndsu", 1, 625),
        team("idaho", 27, 12),
        team("montana", null, 41),
        team("zero", 28, 0),
      ]),
    ).toBe("montana 41, idaho 12");
  });
});

describe("sendPollAlerts", () => {
  beforeEach(() => {
    mockSince.mockResolvedValue([FCS_WEEK]);
    mockWeeks.mockResolvedValue([{ week: 10 }, { week: 11 }]);
    mockRankings.mockImplementation(async ({ week }: { week: number }) => ({
      rankings:
        week === 11
          ? [
              team("ndsu", 1, 625, { firstPlaceVotes: 25 }),
              team("idaho", 26, 12),
            ]
          : [team("ndsu", 2, 600)],
    }));
    mockBroadcast.mockResolvedValue({ status: "sent", broadcastId: "bc_1" });
  });
  afterEach(() => vi.clearAllMocks());

  it("alerts each poll week published in the last six hours, once", async () => {
    expect(await sendPollAlerts(config, NOW)).toEqual([
      { status: "sent", broadcastId: "bc_1", poll: "FCS Top 25", week: 11 },
    ]);
    expect(mockSince).toHaveBeenCalledWith(
      new Date("2026-11-16T09:10:00.000Z"),
    );

    const args = mockBroadcast.mock.lastCall?.[1] as BroadcastArgs;
    expect(args).toMatchObject({
      key: "newsletter:poll:poll-fcs:week-11",
      ttlSeconds: 60 * 24 * 60 * 60,
      topic: { name: "Football: FCS Top 25", defaultSubscription: "opt_out" },
    });

    const content = await args.content();
    expect(content).toMatchObject({
      name: "Football: FCS Top 25: 2026 Week 11",
      subject: "Football: FCS Top 25, Week 11: ndsu is No. 1",
    });
    expect(mockRankings).toHaveBeenCalledWith({
      year: 2026,
      week: 10,
      division: "fcs",
      sport: "football",
    });
    const html = await render(content.react);
    expect(html).toContain("▲1");
    expect(html).toContain("idaho 12");
    expect(html).toContain(
      "http://localhost:3000/college/football/rankings/fcs/2026/11/ballots",
    );
    expect(html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
  });

  it("alerts a season's first poll without movement", async () => {
    mockWeeks.mockResolvedValue([{ week: 11 }]);
    await sendPollAlerts(config, NOW);
    const args = mockBroadcast.mock.lastCall?.[1] as BroadcastArgs;
    await args.content();
    expect(mockRankings).toHaveBeenCalledOnce();
  });

  it("titles an empty poll without a No. 1", async () => {
    mockRankings.mockResolvedValue({ rankings: [] });
    await sendPollAlerts(config, NOW);
    const args = mockBroadcast.mock.lastCall?.[1] as BroadcastArgs;
    expect((await args.content()).subject).toBe(
      "Football: FCS Top 25, Week 11",
    );
  });

  it("does nothing when nothing was published", async () => {
    mockSince.mockResolvedValue([]);
    expect(await sendPollAlerts(config, NOW)).toEqual([]);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });
});
