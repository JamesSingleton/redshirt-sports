export type RssFeedLink = {
  path: string;
  title: string;
};

function appName() {
  return `${process.env.NEXT_PUBLIC_APP_NAME}`;
}

export function getSiteFeed(): RssFeedLink {
  return { path: "/api/rss/feed.xml", title: appName() };
}

export function getSportFeed(sport: {
  slug: string;
  title: string;
}): RssFeedLink {
  return {
    path: `/api/rss/${sport.slug}/feed.xml`,
    title: `${appName()}: ${sport.title} News`,
  };
}

export function getDivisionFeed({
  sport,
  division,
}: {
  sport: { slug: string; title: string };
  division: { slug: string; name: string };
}): RssFeedLink {
  return {
    path: `/api/rss/${sport.slug}/${division.slug}/feed.xml`,
    title: `${appName()}: ${division.name} ${sport.title} News`,
  };
}
