import {
  isActivePath,
  type ResolveLatestRankingsHref,
  resolveLatestRankingsLinks,
  toNavigation,
} from "@/lib/navigation";

describe("toNavigation", () => {
  it("drops links without an href and menus left empty", () => {
    const navigation = toNavigation({
      items: [
        {
          _key: "teams",
          type: "link",
          name: "Teams",
          href: null,
          openInNewTab: null,
        },
        {
          _key: "football",
          type: "menu",
          title: "Football",
          links: [
            {
              _key: "fbs",
              name: "FBS",
              description: null,
              href: "/college/football/news/fbs",
              openInNewTab: null,
            },
            {
              _key: "fcs",
              name: "FCS",
              description: null,
              href: null,
              openInNewTab: null,
            },
          ],
        },
        {
          _key: "hoops",
          type: "menu",
          title: "Men's Basketball",
          links: [
            {
              _key: "mid",
              name: "Mid-Major",
              description: null,
              href: null,
              openInNewTab: null,
            },
          ],
        },
      ],
      secondaryLinks: null,
      cta: { name: null, href: "/vote", openInNewTab: false },
    });

    expect(navigation).toEqual({
      items: [
        {
          type: "menu",
          key: "football",
          title: "Football",
          links: [
            {
              key: "fbs",
              name: "FBS",
              href: "/college/football/news/fbs",
              description: null,
              openInNewTab: false,
            },
          ],
        },
      ],
      secondaryLinks: [],
      cta: null,
    });
  });

  it("keeps complete top-level links, quick links and the CTA", () => {
    const navigation = toNavigation({
      items: [
        {
          _key: "teams",
          type: "link",
          name: "Teams",
          href: "/college/teams",
          openInNewTab: true,
        },
      ],
      secondaryLinks: [
        { _key: "about", name: "About", href: "/about", openInNewTab: null },
      ],
      cta: { name: "Vote", href: "/vote", openInNewTab: null },
    });

    expect(navigation.items).toEqual([
      {
        type: "link",
        key: "teams",
        name: "Teams",
        href: "/college/teams",
        description: null,
        openInNewTab: true,
      },
    ]);
    expect(navigation.secondaryLinks).toHaveLength(1);
    expect(navigation.cta).toEqual({
      key: "cta",
      name: "Vote",
      href: "/vote",
      description: null,
      openInNewTab: false,
    });
  });

  it("returns an empty navigation for a missing document", () => {
    expect(toNavigation(null)).toEqual({
      items: [],
      secondaryLinks: [],
      cta: null,
    });
  });
});

describe("resolveLatestRankingsLinks", () => {
  const fcs = {
    sport: "football",
    poll: "fcs",
    label: "Latest FCS rankings",
  };
  const midMajor = {
    sport: "mens-basketball",
    poll: "mid-major",
    label: "Latest Men's Basketball Mid-Major rankings",
  };

  const resolveHref = vi.fn<ResolveLatestRankingsHref>(
    async ({ sport, poll }) =>
      poll === "fcs" ? `/college/${sport}/rankings/${poll}/2026/4` : null,
  );

  it("points latest-rankings links at the newest poll in every slot", async () => {
    const resolved = await resolveLatestRankingsLinks(
      {
        items: [
          {
            _key: "rankings",
            type: "menu",
            title: "Rankings",
            links: [
              {
                _key: "fcs",
                name: null,
                href: null,
                openInNewTab: null,
                latestRankings: fcs,
              },
            ],
          },
          {
            _key: "top",
            type: "link",
            name: "FCS Top 25",
            href: null,
            openInNewTab: null,
            latestRankings: fcs,
          },
        ],
        secondaryLinks: [
          {
            _key: "quick",
            name: null,
            href: null,
            openInNewTab: null,
            latestRankings: fcs,
          },
        ],
        cta: {
          name: null,
          href: null,
          openInNewTab: null,
          latestRankings: fcs,
        },
      },
      resolveHref,
    );

    const navigation = toNavigation(resolved);
    const href = "/college/football/rankings/fcs/2026/4";

    expect(navigation.items).toEqual([
      {
        type: "menu",
        key: "rankings",
        title: "Rankings",
        links: [
          {
            key: "fcs",
            name: "Latest FCS rankings",
            href,
            description: null,
            openInNewTab: false,
          },
        ],
      },
      {
        type: "link",
        key: "top",
        name: "FCS Top 25",
        href,
        description: null,
        openInNewTab: false,
      },
    ]);
    expect(navigation.secondaryLinks[0]).toMatchObject({
      name: "Latest FCS rankings",
      href,
    });
    expect(navigation.cta).toMatchObject({ name: "Latest FCS rankings", href });
  });

  it("drops links whose poll has no rankings and leaves other links alone", async () => {
    const resolved = await resolveLatestRankingsLinks(
      {
        items: [
          {
            _key: "hoops",
            type: "menu",
            title: "Men's Basketball",
            links: [
              {
                _key: "mid",
                name: null,
                href: null,
                openInNewTab: null,
                latestRankings: midMajor,
              },
              {
                _key: "news",
                name: "News",
                href: "/college/mens-basketball/news",
                openInNewTab: null,
                latestRankings: null,
              },
            ],
          },
        ],
        secondaryLinks: null,
        cta: null,
      },
      resolveHref,
    );

    expect(toNavigation(resolved).items).toEqual([
      {
        type: "menu",
        key: "hoops",
        title: "Men's Basketball",
        links: [
          {
            key: "news",
            name: "News",
            href: "/college/mens-basketball/news",
            description: null,
            openInNewTab: false,
          },
        ],
      },
    ]);
  });

  it("skips the lookup for a half-configured link", async () => {
    resolveHref.mockClear();
    const resolved = await resolveLatestRankingsLinks(
      {
        items: null,
        secondaryLinks: [
          {
            _key: "draft",
            name: null,
            href: null,
            openInNewTab: null,
            latestRankings: { sport: "football", poll: null, label: null },
          },
        ],
        cta: null,
      },
      resolveHref,
    );

    expect(resolveHref).not.toHaveBeenCalled();
    expect(toNavigation(resolved).secondaryLinks).toEqual([]);
  });

  it("passes a missing document through", async () => {
    expect(await resolveLatestRankingsLinks(null, resolveHref)).toBeNull();
  });
});

describe("isActivePath", () => {
  it("matches the exact path and nested paths", () => {
    expect(isActivePath("/college/football", "/college/football")).toBe(true);
    expect(isActivePath("/college/football/news", "/college/football")).toBe(
      true,
    );
    expect(isActivePath("/college/footballs", "/college/football")).toBe(false);
  });

  it("only matches home exactly", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/about", "/")).toBe(false);
  });
});
