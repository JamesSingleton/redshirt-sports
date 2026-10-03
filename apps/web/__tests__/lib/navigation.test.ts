import { isActivePath, toNavigation } from "@/lib/navigation";

describe("toNavigation", () => {
  it("drops links without an href and menus left empty", () => {
    const navigation = toNavigation({
      _id: "navbar",
      logo: null,
      logoDark: null,
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
      _id: "navbar",
      logo: null,
      logoDark: null,
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
