import type { HomePost } from "@/components/home/home-page-content";
import {
  buildCollegeNewsCollectionJsonLd,
  buildConferenceNewsCollectionJsonLd,
  buildDivisionNewsCollectionJsonLd,
  buildSportNewsCollectionJsonLd,
} from "@/lib/news-archive/collection-json-ld";

function post(slug: string): HomePost {
  return { _id: slug, title: slug, slug };
}

describe("news archive collection JSON-LD", () => {
  it("builds division collection metadata", () => {
    const data = buildDivisionNewsCollectionJsonLd({
      sport: "football",
      division: "fbs",
      sportTitle: "Football",
      divisionTitle: "FBS",
      divisionOrSubgroupingName: "FBS",
      pageIndex: 1,
      posts: [post("story-a"), post("story-b")],
      totalPosts: 2,
    });

    const mainEntity = data.mainEntity as {
      itemListElement?: unknown[];
    };

    expect(data["@type"]).toBe("CollectionPage");
    expect(data.url).toContain("/college/football/news/fbs");
    expect(mainEntity.itemListElement).toHaveLength(2);
  });

  it("falls back when sport or division titles are missing", () => {
    const data = buildDivisionNewsCollectionJsonLd({
      sport: "football",
      division: "fbs",
      sportTitle: null,
      divisionTitle: null,
      divisionOrSubgroupingName: "FBS",
      pageIndex: 1,
      posts: [post("story")],
      totalPosts: 1,
    });

    const breadcrumb = data.breadcrumb as {
      itemListElement?: Array<{ name?: string }>;
    };

    expect(breadcrumb.itemListElement?.[2]?.name).toBe("football");
  });

  it("builds conference collection metadata", () => {
    const data = buildConferenceNewsCollectionJsonLd({
      sport: "football",
      division: "fbs",
      conference: "sec",
      sportTitle: "Football",
      divisionOrSubgroupingName: "FBS",
      conferenceName: "Southeastern Conference",
      conferenceShortName: "SEC",
      pageIndex: 2,
      posts: [post("sec-story")],
      totalPosts: 10,
    });

    expect(data.url).toContain("?page=2");
    expect(data.name).toContain("SEC");
  });

  it("uses the long conference name when shortName is omitted", () => {
    const data = buildConferenceNewsCollectionJsonLd({
      sport: "football",
      division: "fbs",
      conference: "sec",
      sportTitle: "Football",
      divisionOrSubgroupingName: "FBS",
      conferenceName: "Southeastern Conference",
      conferenceShortName: null,
      pageIndex: 1,
      posts: [post("sec-story")],
      totalPosts: 1,
    });

    expect(data.name).toBe("Southeastern Conference Football News");
  });

  it("falls back to the sport slug when sportTitle is missing", () => {
    const data = buildConferenceNewsCollectionJsonLd({
      sport: "football",
      division: "fbs",
      conference: "sec",
      sportTitle: null,
      divisionOrSubgroupingName: "FBS",
      conferenceName: "Southeastern Conference",
      conferenceShortName: "SEC",
      pageIndex: 1,
      posts: [post("sec-story")],
      totalPosts: 1,
    });

    const breadcrumb = data.breadcrumb as {
      itemListElement?: Array<{ name?: string }>;
    };

    expect(breadcrumb.itemListElement?.[2]?.name).toBe("football");
  });

  it("builds college and sport collection pages", () => {
    const college = buildCollegeNewsCollectionJsonLd({
      pageIndex: 2,
      posts: [post("story-a")],
      totalPosts: 12,
    });
    const sport = buildSportNewsCollectionJsonLd({
      sport: "football",
      sportTitle: null,
      pageIndex: 1,
      posts: [post("story-a")],
    });

    const firstPage = buildCollegeNewsCollectionJsonLd({
      pageIndex: 1,
      posts: [],
    });
    const namedSport = buildSportNewsCollectionJsonLd({
      sport: "football",
      sportTitle: "Football",
      pageIndex: 2,
      posts: [post("story-b")],
      totalPosts: 4,
    });

    expect(college.url).toContain("/college/news?page=2");
    expect(firstPage.url).not.toContain("page=");
    expect(college["@type"]).toBe("CollectionPage");
    expect(sport.name).toBe("football News");
    expect(namedSport.name).toBe("Football News");
    expect(namedSport.url).toContain("?page=2");
  });
});
