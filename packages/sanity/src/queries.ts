import { defineQuery, groq } from "next-sanity";

export const querySettingsData = defineQuery(/* groq */ `
  *[_type == "settings" && _id == "settings"][0]{
    _id,
    _type,
    siteBrand,
    siteTitle,
    siteDescription,
    "logo": logo.asset->url + "?w=512&fm=png&fit=max",
    "socialLinks": socialLinks,
    "contactEmail": contactEmail,
    newsroomPolicies,
  }
`);

const customUrlHrefSelect = /* groq */ `
  select(
    type == "external" => external,
    type == "internal" && internalType == "custom" => internalUrl,
    type == "internal" && internalType == "sportNews" && sportNewsLink.routeDepth == "sportNews" =>
      "/college/" + sportNewsLink.sport->slug.current + "/news",
    type == "internal" && internalType == "sportNews" && sportNewsLink.routeDepth == "divisionNews" =>
      "/college/" + sportNewsLink.sport->slug.current + "/news/" + sportNewsLink.segment->slug.current,
    type == "internal" && internalType == "sportNews" && sportNewsLink.routeDepth == "conferenceNews" =>
      "/college/" + sportNewsLink.sport->slug.current + "/news/" + sportNewsLink.segment->slug.current + "/" + sportNewsLink.conference->slug.current,
    type == "internal" && internal->_type == "post" => "/" + internal->slug.current,
    type == "internal" && internal->_type == "school" => "/college/teams/" + internal->slug.current,
    type == "internal" && internal->_type == "author" => "/people/" + internal->slug.current,
    type == "internal" && internal->_type == "legal" => "/legal/" + internal->slug.current,
    href
  )
`;

const customLinkMarkFragment = /* groq */ `
  "openInNewTab": customLink.openInNewTab,
  "href": select(
    customLink.type == "external" => customLink.external,
    customLink.type == "internal" && customLink.internalType == "custom" => customLink.internalUrl,
    customLink.type == "internal" && customLink.internalType == "sportNews" && customLink.sportNewsLink.routeDepth == "sportNews" =>
      "/college/" + customLink.sportNewsLink.sport->slug.current + "/news",
    customLink.type == "internal" && customLink.internalType == "sportNews" && customLink.sportNewsLink.routeDepth == "divisionNews" =>
      "/college/" + customLink.sportNewsLink.sport->slug.current + "/news/" + customLink.sportNewsLink.segment->slug.current,
    customLink.type == "internal" && customLink.internalType == "sportNews" && customLink.sportNewsLink.routeDepth == "conferenceNews" =>
      "/college/" + customLink.sportNewsLink.sport->slug.current + "/news/" + customLink.sportNewsLink.segment->slug.current + "/" + customLink.sportNewsLink.conference->slug.current,
    customLink.type == "internal" && customLink.internal->_type == "post" => "/" + customLink.internal->slug.current,
    customLink.type == "internal" && customLink.internal->_type == "school" => "/college/teams/" + customLink.internal->slug.current,
    customLink.type == "internal" && customLink.internal->_type == "author" => "/people/" + customLink.internal->slug.current,
    customLink.type == "internal" && customLink.internal->_type == "legal" => "/legal/" + customLink.internal->slug.current,
    customLink.href
  )
`;

/** Site path for a document a link references: article, team, author, legal. */
const linkReferencePath = /* groq */ `
  select(
    reference->_type == "post" => "/" + reference->slug.current,
    reference->_type == "school" => "/college/teams/" + reference->slug.current,
    reference->_type == "author" => "/people/" + reference->slug.current,
    reference->_type == "legal" => "/legal/" + reference->slug.current
  )
`;

const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
    // The current link annotation. An old-format link (only an href) has no
    // linkType, so it falls through to its href unchanged.
    _type == "link" => {
      ...,
      "href": select(
        linkType == "internal" => ${linkReferencePath},
        linkType == "path" => path,
        href
      ),
      "openInNewTab": coalesce(openInNewTab, blank, false)
    },
    _type == "customLink" => {
      ...,
      ${customLinkMarkFragment}
    },
    _type == "customUrl" => {
      ...,
      "href": ${customUrlHrefSelect}
    },
    _type == "internalLink" => {
      ...,
      "href": select(
        reference->_type == "post" => "/" + reference->slug.current,
        reference->_type == "school" => "/college/teams/" + reference->slug.current,
        reference->_type == "author" => "/people/" + reference->slug.current,
        "#"
      )
    }
  }
`;

const customUrlHrefFragment = /* groq */ `
  "href": select(
    url.type == "external" => url.external,
    url.type == "internal" && url.internalType == "custom" => url.internalUrl,
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "sportNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news",
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "divisionNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news/" + url.sportNewsLink.segment->slug.current,
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "conferenceNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news/" + url.sportNewsLink.segment->slug.current + "/" + url.sportNewsLink.conference->slug.current,
    url.type == "internal" && url.internal->_type == "post" => "/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "school" => "/college/teams/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "author" => "/people/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "legal" => "/legal/" + url.internal->slug.current,
    url.href
  )
`;

const imageGeometryProjection = /* groq */ `
  "id": asset._ref,
  "alt": coalesce(alt, caption, asset->altText, asset->originalFilename, "Image-Broken"),
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  // height/width are required — projecting only x/y makes @sanity/image-url emit rect=...,NaN,...
  hotspot {
    x,
    y,
    height,
    width
  },
  crop {
    bottom,
    left,
    right,
    top
  }
`;

const coreImageMetadataProjection = /* groq */ `
  ${imageGeometryProjection},
  "preview": asset->metadata.lqip,
  "dominantColor": asset->metadata.palette.dominant.background
`;

const imageMetadataProjection = /* groq */ `
  ${coreImageMetadataProjection},
  "credit": coalesce(asset->creditLine, attribution)
`;

const imageFragment = /* groq */ `
  image{
    ...,
    ${imageMetadataProjection}
  }
`;

const logoFragment = /* groq */ `
  logo{
    ...,
    ${coreImageMetadataProjection}
  }
`;

const schoolImageFragment = /* groq */ `
  image{
    ...,
    ${imageGeometryProjection}
  }
`;

const postImageFragment = /* groq */ `
  image{
    ...,
    ${imageMetadataProjection}
  }
`;

const footerLogoFragment = /* groq */ `
  footerLogo{
    ...,
    ${coreImageMetadataProjection}
  }
`;

const footerLogoDarkModeFragment = /* groq */ `
  footerLogoDarkMode{
    ...,
    ${coreImageMetadataProjection}
  }
`;

const authorListImageFragment = /* groq */ `
  image{
    ...,
    ${coreImageMetadataProjection},
    "alt": coalesce(caption, asset->altText, ^.name, asset->originalFilename, "Image-Broken"),
  }
`;

const postAuthorFragment = /* groq */ `
  authors[]->{
    ...,
    "slug": slug.current,
    ${imageFragment}
  }
`;

const homePostCardFragment = /* groq */ `
  _id,
  title,
  excerpt,
  "slug": slug.current,
  publishedAt,
  ${postImageFragment},
  ${postAuthorFragment},
  "divisionLabel": coalesce(
    sportSubgrouping->shortName,
    sportSubgrouping->name,
    coalesce(classification, division)->shortName,
    coalesce(classification, division)->name
  ),
  "divisionSlug": coalesce(classification, division)->slug.current,
  "subgroupingSlug": sportSubgrouping->slug.current,
  "tagNames": tags[]->name,
  "sportTitle": sport->title,
  "sportSlug": sport->slug.current
`;

const postSportFragment = /* groq */ `
  sport->{
    _id,
    "slug": slug.current,
    title
  }
`;

export const queryImageType = defineQuery(`
  *[_type == "post" && defined(image)][0]{
    ${postImageFragment}
  }.image
`);

/**
 * A post's level of play. The Sanity type is `classification`; the key stays
 * `division` because that is what the site's routes and components call it.
 * Projections read `coalesce(classification, division)` so posts editorial-01
 * hasn't moved yet keep their level; drop the fallback after editorial-10.
 */
const divisionFragment = /* groq */ `
  "division": coalesce(classification, division)->{
    _id,
    "name": coalesce(shortName, name),
    "fullName": name,
    "slug": slug.current
  }
`;

const sportSubgroupingFragment = /* groq */ `
  sportSubgrouping->{
    ...,
    "slug": slug.current,
  }
`;

const conferencesFragment = /* groq */ `
  conferences[]->{
    _id,
    name,
    shortName,
    "slug": slug.current,
    ${logoFragment},
    "division": primaryClassification->{
      "slug": slug.current,
    },
    sportSubdivisionAffiliations[]{
        _key,
        sport->{
          _id, // Need this _id for client-side comparison
        },
        subgrouping->{
          "slug": slug.current,
          name,
          shortName
        }
      }
  }
`;

const richTextFragment = /* groq */ `
  body[]{
    ...,
    ${markDefsFragment},
    _type == 'image' => {
      ...,
      ${imageMetadataProjection}
    },
    _type == 'relatedArticle' => {
      ...,
      "post": post->{
        _id,
        title,
        excerpt,
        "slug": slug.current,
        ${postImageFragment}
      }
    },
  }
`;

export const queryPostSlugData = defineQuery(/* groq */ `
  *[_type == "post" && slug.current == $slug][0]{
    ...,
    "slug": slug.current,
    sport->{
      _id,
      "slug": slug.current,
      title
    },
    ${divisionFragment},
    ${sportSubgroupingFragment},
    ${conferencesFragment},
    authors[]->{
      ...,
      "slug": slug.current,
      ${imageFragment},
      // For the author's Person structured data.
      "knowsAbout": beats[]->title
    },
    "contributors": contributors[]->{ _id, name, "slug": slug.current, archived },
    "editedBy": editedBy->{ _id, name, "slug": slug.current },
    ${postImageFragment},
    ${richTextFragment},
    tags[]->{
      _id,
      name
    },
    teams[]->{
      _id,
      name,
      shortName,
      nickname,
      "slug": slug.current,
      ${schoolImageFragment}
    }
  }
`);

/**
 * The article page's related, up-next, and more-from-author lists. Kept out
 * of `queryPostSlugData` because any `_type == "post"` list gets Sanity's
 * type-wide sync tag; the web app fetches this without sync tags and tags it
 * by the listed posts instead (see `@redshirt-sports/sanity/cache-tags`).
 * Every list only holds posts published before the article, so new posts
 * never change an existing article's page.
 */
export const queryArticleLists = defineQuery(/* groq */ `
  {
    "relatedPosts": *[
      _type == "post"
      && defined(publishedAt)
      && defined(slug.current)
      && _id != $postId
      && (!defined($publishedAt) || publishedAt < $publishedAt)
      && (
        (defined($sportId) && sport._ref == $sportId)
        || count(conferences[@._ref in $conferenceIds]) > 0
        || count(tags[@._ref in $tagIds]) > 0
        || count(teams[@._ref in $teamIds]) > 0
      )
    ] | order(publishedAt desc, _id desc)[0...3] {
      _id,
      title,
      publishedAt,
      ${postImageFragment},
      "slug": slug.current,
      "tagNames": tags[]->name,
      "division": coalesce(classification, division)->{ "name": coalesce(shortName, name) },
      sportSubgrouping->{ shortName, name },
      ${postAuthorFragment}
    },
    "upNextInFeed": *[
      _type == "post"
      && defined(publishedAt)
      && defined(slug.current)
      && _id != $postId
      && defined($publishedAt)
      && publishedAt < $publishedAt
      && (!defined($sportId) || sport._ref == $sportId)
    ] | order(publishedAt desc)[0] {
      _id,
      title,
      publishedAt,
      ${postImageFragment},
      "slug": slug.current,
      "tagNames": tags[]->name,
      "division": coalesce(classification, division)->{ "name": coalesce(shortName, name) },
      sportSubgrouping->{ shortName, name }
    },
    "moreFromAuthor": *[
      _type == "post"
      && defined(publishedAt)
      && _id != $postId
      && (!defined($publishedAt) || publishedAt < $publishedAt)
      && count(authors[@._ref in $authorIds]) > 0
    ] | order(publishedAt desc)[0...3]{
      _id,
      title,
      "slug": slug.current
    }
  }
`);

/** Newest-first post slugs for `generateStaticParams`; `$limit` caps the count. */
export const queryPostPaths = defineQuery(/* groq */ `
  *[_type == "post" && defined(slug.current)]| order(publishedAt desc)[0...$limit]{"slug": slug.current}
`);

/** Minimum published posts tagging a school before its team hub is public (matches team directory). */
export const MIN_TEAM_PAGE_POSTS = 1;

/** How many school-tagged posts to load for the team hub news sections. */
export const TEAM_PAGE_NEWS_FETCH_SIZE = 8;

const publishedPostsTaggingSchoolFilter = /* groq */ `
  _type == "post" &&
  defined(publishedAt) &&
  $schoolId in teams[]._ref
`;

const publishedPostsTaggingSchoolFromParentFilter = /* groq */ `
  _type == "post" &&
  defined(publishedAt) &&
  ^._id in teams[]._ref
`;

export const querySchoolPaths = defineQuery(/* groq */ `
  *[
    _type == "school" &&
    defined(slug.current) &&
    count(*[${publishedPostsTaggingSchoolFromParentFilter}]) >= $minPosts
  ] | order(_updatedAt desc) [0...100]{"slug": slug.current}
`);

const teamDirectorySchoolProjection = /* groq */ `
  _id,
  name,
  shortName,
  nickname,
  "slug": slug.current,
  ${schoolImageFragment}
`;

export const queryTeamDirectorySchools = defineQuery(/* groq */ `
  *[
    _type == "school" &&
    defined(slug.current) &&
    count(*[${publishedPostsTaggingSchoolFromParentFilter}]) > 0
  ] | order(coalesce(shortName, name) asc) {
    ${teamDirectorySchoolProjection}
  }
`);

export const queryTeamDirectorySchoolsByIds = defineQuery(/* groq */ `
  *[
    _type == "school" &&
    defined(slug.current) &&
    _id in $ids
  ] | order(coalesce(shortName, name) asc) {
    ${teamDirectorySchoolProjection}
  }
`);

/*
 * Archive filters compare reference ids, never `->` lookups. A lookup inside a
 * filter runs for every candidate article (1.2 s per archive page at 1,000
 * articles, growing with every one published); these subqueries don't depend
 * on the article, so they resolve once (about 250 ms for the same page).
 */
const sportIdBySlug = /* groq */ `*[_type == "sport" && slug.current == $sport][0]._id`;
/**
 * The division (`d2`) or subdivision (`fcs`) named by `$division`.
 *
 * Transitional: `division` documents and fields are read too, so archives
 * are right before and after the editorial-01 migration moves them to
 * `classification`. Remove the `division` parts after editorial-10.
 */
const segmentIdsBySlug = /* groq */ `*[_type in ["sportSubgrouping", "classification", "division"] && slug.current == $division]._id`;
const postInSegment = /* groq */ `(sportSubgrouping._ref in ${segmentIdsBySlug} || classification._ref in ${segmentIdsBySlug} || division._ref in ${segmentIdsBySlug})`;
/** The archive's "Type" filter: the article's format (`storyType`), e.g. "analysis". */
const storyTypeFilter = /* groq */ `($storyType == "" || storyType == $storyType)`;
/**
 * The conference `$conference`, when it belongs on the `$division` page for
 * `$sport`: through its subdivision for that sport, or its division when that
 * division isn't split (not d1).
 */
const archiveConferenceIds = /* groq */ `*[
  _type == "conference" &&
  slug.current == $conference &&
  (
    count(sportSubdivisionAffiliations[sport._ref == ${sportIdBySlug} && subgrouping._ref in ${segmentIdsBySlug}]) > 0 ||
    ($division != "d1" && (primaryClassification._ref in ${segmentIdsBySlug} || division._ref in ${segmentIdsBySlug}))
  )
]._id`;

/*
 * Archive pagination. `?page=N` slices, which sorts and skips every earlier
 * article (219 ms at page 40 and growing). The "Next" link also carries the
 * last article it showed as `$afterAt`/`$afterId`, and the next page starts
 * right after it (18 ms at any depth). Both are null for a plain `?page=N`.
 * `_id` breaks ties so articles published in the same second never repeat
 * or drop between pages.
 */
const afterCursorNewest = /* groq */ `(!defined($afterAt) || publishedAt < $afterAt || (publishedAt == $afterAt && _id < $afterId))`;
const afterCursorOldest = /* groq */ `(!defined($afterAt) || publishedAt > $afterAt || (publishedAt == $afterAt && _id > $afterId))`;

const sportsNewsFilter = /* groq */ `
  _type == "post" &&
  sport._ref == ${sportIdBySlug} &&
  ($search == "" || title match "*" + $search + "*") &&
  ${storyTypeFilter}
`;

export const querySportsNews = defineQuery(/* groq */ `
  {
    "posts": *[${sportsNewsFilter} && ${afterCursorNewest}] | order(publishedAt desc, _id desc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${sportsNewsFilter}])
  }
`);

export const querySportsNewsOldest = defineQuery(/* groq */ `
  {
    "posts": *[${sportsNewsFilter} && ${afterCursorOldest}] | order(publishedAt asc, _id asc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${sportsNewsFilter}])
  }
`);

const sportsDivisionNewsFilter = /* groq */ `
  _type == "post" &&
  sport._ref == ${sportIdBySlug} &&
  ${postInSegment} &&
  $division != "d1" &&
  ($search == "" || title match "*" + $search + "*") &&
  ${storyTypeFilter}
`;

export const querySportsAndDivisionNews = defineQuery(/* groq */ `
  {
    "posts": *[${sportsDivisionNewsFilter} && ${afterCursorNewest}] | order(publishedAt desc, _id desc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${sportsDivisionNewsFilter}])
  }
`);

export const querySportsAndDivisionNewsOldest = defineQuery(/* groq */ `
  {
    "posts": *[${sportsDivisionNewsFilter} && ${afterCursorOldest}] | order(publishedAt asc, _id asc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${sportsDivisionNewsFilter}])
  }
`);

export const queryFooterData = defineQuery(/* groq */ `
  *[_type == "footer" && _id == "footer"][0]{
    _id,
    subtitle,
    columns[]{
      _key,
      title,
      links[]{
        _key,
        name,
        "openInNewTab": url.openInNewTab,
        ${customUrlHrefFragment}
      }
    },
  }
`);

export const queryGlobalSeoSettings = defineQuery(/* groq */ `
  *[_type == "settings" && _id == "settings"][0]{
    _id,
    _type,
    siteBrand,
    siteTitle,
    siteDescription,
    ${logoFragment},
    ${footerLogoFragment},
    ${footerLogoDarkModeFragment},
    "defaultOpenGraphImage": defaultOpenGraphImage.asset->url + "?w=1200&h=630&dpr=3&fit=max",
    socialLinks{
      facebook,
      twitter,
      youtube,
      instagram,
      bluesky,
      threads
    }
  }
`);

const navSportFragment = /* groq */ `
  _id,
  "name": title,
  "slug": slug.current,
  "polls": polls[defined(slug)]{ _key, slug, label }
`;

/**
 * Site navigation from the `navbar` singleton. Reads only that document and
 * the sports/divisions it references, so post publishes don't change its
 * cache tags (the navbar is in every page's static shell).
 */
export const queryNavbarData = defineQuery(/* groq */ `
  *[_type == "navbar" && _id == "navbar"][0]{
    _id,
    "items": items[]{
      _key,
      _type,
      _type == "navSportMenu" => {
        label,
        "sport": sport->{ ${navSportFragment} },
        "divisions": divisions[defined(@->slug.current)]->{
          _id,
          "name": coalesce(shortName, name, title),
          "slug": slug.current
        }
      },
      _type == "navRankingsMenu" => {
        "label": coalesce(label, "Rankings"),
        "sports": sports[defined(@->slug.current)]->{ ${navSportFragment} },
        "links": links[defined(sport._ref) && defined(name)]{
          _key,
          name,
          description,
          "sportId": sport._ref,
          "openInNewTab": url.openInNewTab,
          ${customUrlHrefFragment}
        }
      },
      _type == "navbarColumn" => {
        title,
        links[]{
          _key,
          name,
          description,
          "openInNewTab": url.openInNewTab,
          ${customUrlHrefFragment}
        }
      },
      _type == "navbarLink" => {
        name,
        "openInNewTab": url.openInNewTab,
        ${customUrlHrefFragment}
      }
    }
  }
`);

export const queryHomePageData = defineQuery(/* groq */ `
  *[_type == "post"] | order(publishedAt desc)[0...3]{
    _id,
    _type,
    title,
    excerpt,
    "slug": slug.current,
    ${postImageFragment},
    publishedAt,
    ${postAuthorFragment}
  }
`);

const homeTopStoryIds = /* groq */ `coalesce(*[_type == "collection" && key == "home-top-stories"][0].articles[]._ref, [])`;

/**
 * The homepage river: the editors' "Homepage top stories" collection first,
 * in their order, then the latest articles. A pinned article that is
 * unpublished or deleted is skipped (the collection holds weak references).
 */
export const queryHomeFeed = defineQuery(/* groq */ `
  (
    coalesce((*[_type == "collection" && key == "home-top-stories"][0].articles[]->{
      ${homePostCardFragment}
    })[defined(slug) && defined(publishedAt)], []) +
    *[_type == "post" && !(_id in ${homeTopStoryIds})] | order(publishedAt desc)[0...48]{
      ${homePostCardFragment}
    }
  )[0...48]
`);

/**
 * The site-wide breaking-news banner, when there is a live one. The page
 * hides it at expiresAt on the reader's clock, because a cached page can
 * outlive the alert.
 */
export const queryBreakingNews = defineQuery(/* groq */ `
  *[_id == "breakingNews" && defined(article) && dateTime(expiresAt) > dateTime(now())][0]{
    "label": coalesce(label, "Breaking"),
    expiresAt,
    // Null when the article was unpublished or deleted (a weak reference).
    "article": select(
      defined(article->publishedAt) => article->{ title, "slug": slug.current }
    )
  }
`);

export const queryLatestArticles = defineQuery(/* groq */ `
 *[_type == "post"] | order(publishedAt desc)[3..6]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    publishedAt,
    ${postImageFragment},
    ${postAuthorFragment}
  }
`);

export const queryLatestCollegeSportsArticles = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    (
      classification._ref in *[_type == "classification" && name == $division]._id ||
      sportSubgrouping._ref in *[_type == "sportSubgrouping" && name == $division]._id
    ) &&
    sport._ref in *[_type == "sport" && title match $sport]._id &&
    !(_id in $articleIds)
  ] | order(publishedAt desc)[0..4]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    ${postImageFragment},
    publishedAt,
    "division": coalesce(classification, division)->{
      "name": coalesce(shortName, name),
      "slug": slug.current
    },
    conferences[]->{
      name,
      "slug": slug.current,
      shortName
    },
    ${postAuthorFragment}
  }
`);

/** Headlines for the Most read rail (full fields resolved after PostHog slug ranking). */
export const queryPostsBySlugs = defineQuery(/* groq */ `
  *[_type == "post" && slug.current in $slugs]{
    _id,
    title,
    "slug": slug.current
  }
`);

export const queryMostReadFallbackPosts = defineQuery(/* groq */ `
  *[_type == "post"] | order(publishedAt desc)[0...5]{
    _id,
    title,
    "slug": slug.current
  }
`);

export const querySitemapData = defineQuery(/* groq */ `{
  "authors": *[_type == "author" && defined(slug.current) && archived == false] {
    "slug": slug.current,
    "lastModified": _updatedAt
  },
  "legal": *[_type == "legal" && defined(slug.current)] {
    "slug": slug.current,
    "lastModified": coalesce(lastUpdated, effectiveDate, _updatedAt)
  },
}`);

const sportDivisionConferenceNewsFilter = /* groq */ `
  _type == "post" &&
  sport._ref == ${sportIdBySlug} &&
  count(conferences[@._ref in ${archiveConferenceIds}]) > 0 &&
  ${postInSegment} &&
  ($search == "" || title match "*" + $search + "*") &&
  ${storyTypeFilter}
`;

export const queryArticlesBySportDivisionAndConference =
  defineQuery(/* groq */ `
  {
    "posts": *[${sportDivisionConferenceNewsFilter} && ${afterCursorNewest}] | order(publishedAt desc, _id desc)[$from...$to]{
      ${homePostCardFragment}
    },
    "conferenceInfo": *[_id in ${archiveConferenceIds}][0]{
      _id,
      name,
      shortName
    },
    "totalPosts": count(*[${sportDivisionConferenceNewsFilter}]),
  }
`);

export const queryArticlesBySportDivisionAndConferenceOldest =
  defineQuery(/* groq */ `
  {
    "posts": *[${sportDivisionConferenceNewsFilter} && ${afterCursorOldest}] | order(publishedAt asc, _id asc)[$from...$to]{
      ${homePostCardFragment}
    },
    "conferenceInfo": *[_id in ${archiveConferenceIds}][0]{
      _id,
      name,
      shortName
    },
    "totalPosts": count(*[${sportDivisionConferenceNewsFilter}]),
  }
`);

const searchFilter = /* groq */ `
  _type == "post" &&
  defined(publishedAt) &&
  (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")
`;

/** Search results: card fields only, best match first, newest breaking ties. */
export const searchQuery = defineQuery(/* groq */ `
{
  "posts": *[${searchFilter}] | score(
    boost(title match $q, 4),
    boost(excerpt match $q, 3),
    boost(pt::text(body) match $q, 2),
  ) | order(_score desc, publishedAt desc)[$from...$to]{
    _id,
    title,
    excerpt,
    publishedAt,
    "slug": slug.current,
    ${postImageFragment},
    "authors": authors[]->{ _id, name, "slug": slug.current },
    "sport": sport->title,
  },
  "totalPosts": count(*[${searchFilter}])
}
`);

export const sportInfoBySlug = defineQuery(/* groq */ `
*[_type == "sport" && slug.current == $slug][0]{
  _id,
  title,
}`);

export const authorBySlug = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug && archived == false][0]{
    ...,
    "slug": slug.current,
    ${imageFragment},
  }
`);

export const postsByAuthor = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug && archived == false][0]{
    "authorId": _id,
    "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[$from...$to]{
      ...,
      "slug": slug.current,
      "division": coalesce(classification, division)->{ "name": coalesce(shortName, name) },
      ${postImageFragment},
      ${postAuthorFragment},
    },
    "totalPosts": count(*[_type == "post" && references(^._id)])
  }
`);

export const authorsListNotArchived = defineQuery(/* groq */ `
  *[_type == "author" && archived != true] | order(_createdAt asc, name asc) {
    _id,
    name,
    roles,
    "slug": slug.current,
    ${authorListImageFragment},
    socialLinks
  }
`);

export const queryLegalDocumentBySlug = defineQuery(/* groq */ `
  *[_type == "legal" && slug.current == $slug][0]{
    _id,
    _type,
    title,
    "slug": slug.current,
    summary,
    effectiveDate,
    "lastUpdated": coalesce(lastUpdated, effectiveDate),
    body[]{
      ...,
      ${markDefsFragment}
    },
    "otherDocuments": *[_type == "legal" && defined(slug.current) && slug.current != $slug] | order(title asc){
      _id,
      title,
      "slug": slug.current
    }
  }
`);

export const queryLegalDocumentPaths = defineQuery(/* groq */ `
  *[_type == "legal" && defined(slug.current)]{"slug": slug.current}
`);

const subgroupingIdsBySlug = /* groq */ `*[_type == "sportSubgrouping" && slug.current == $subgrouping]._id`;

/** Conferences that play `$sport` in the subdivision `$subgrouping`. */
const conferenceIdsInSubgrouping = /* groq */ `*[
  _type == "conference" &&
  count(sportSubdivisionAffiliations[
    sport._ref == ${sportIdBySlug} && subgrouping._ref in ${subgroupingIdsBySlug}
  ]) > 0
]._id`;

/**
 * Schools on a ballot: those that play `$sport` in `$subgrouping`, through
 * their own override when set, otherwise through their conference. Matches
 * on ids instead of resolving a conference for each of 1,100+ schools.
 */
export const schoolsBySportAndSubgroupingStringQuery = defineQuery(/* groq */ `
  *[
    _type == "school" &&
    count(conferenceAffiliations[
      sport._ref == ${sportIdBySlug} &&
      select(
        defined(subgroupingOverride) => subgroupingOverride._ref in ${subgroupingIdsBySlug},
        conference._ref in ${conferenceIdsInSubgrouping}
      )
    ]) > 0
  ] | order(shortName asc) {
    _id,
    name,
    shortName,
    abbreviation,
    ${schoolImageFragment},
    "conferenceInfo": {
      // By _ref: a sport-> lookup per affiliation row cost 1 s on 264 schools.
      "conference": conferenceAffiliations[sport._ref == ${sportIdBySlug}][0].conference->{
        name,
        shortName,
        abbreviation
      }
    }
  }
`);

const collegeNewsFilter = /* groq */ `
  _type == "post" &&
  ($search == "" || title match "*" + $search + "*") &&
  ${storyTypeFilter}
`;

export const queryCollegeNews = defineQuery(/* groq */ `
  {
    "posts": *[${collegeNewsFilter} && ${afterCursorNewest}] | order(publishedAt desc, _id desc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${collegeNewsFilter}])
  }
`);

export const queryCollegeNewsOldest = defineQuery(/* groq */ `
  {
    "posts": *[${collegeNewsFilter} && ${afterCursorOldest}] | order(publishedAt asc, _id asc)[$from...$to]{
      ${homePostCardFragment}
    },
    "totalPosts": count(*[${collegeNewsFilter}])
  }
`);

/** @deprecated Use queryCollegeNews */
export const collegeNewsQuery = queryCollegeNews;

export const conferenceInfoBySlugQuery = defineQuery(/* groq */ `
  *[_type == "conference" && slug.current == $slug][0]
`);

/**
 * Sport → division/subdivision → conference menus for the news archives,
 * listing only conferences with a published article in that sport.
 *
 * Each sport's conferences are found in one pass over its articles
 * (`conferenceIds`). Counting articles per conference instead took 16+ s at
 * 1,000 articles and expired on every publish.
 *
 * A division appears as its own group only for a sport it doesn't split:
 * football at Division I is FBS/FCS, so "d1" never appears for football.
 */
export const globalNavigationQuery = defineQuery(/* groq */ `
  *[_type == "sport"]{
    _id,
    title,
    "slug": slug.current,
    "conferenceIds": array::unique(*[_type == "post" && sport._ref == ^._id && defined(publishedAt)].conferences[]._ref)
  }[count(conferenceIds) > 0] | order(title asc) {
    _id,
    "name": title,
    slug,
    "groupings": (
      *[_type == "sportSubgrouping" && ^._id in applicableSports[]._ref] | order(name asc) {
        _id,
        "name": coalesce(shortName, name),
        "slug": slug.current,
        "type": "subgrouping",
        "conferences": *[
          _type == "conference" &&
          _id in ^.^.conferenceIds &&
          count(sportSubdivisionAffiliations[subgrouping._ref == ^.^._id && sport._ref == ^.^.^._id]) > 0
        ] | order(name asc) { _id, name, shortName, "slug": slug.current }
      } +
      *[
        _type == "classification" &&
        count(*[_type == "sportSubgrouping" && parentClassification._ref == ^._id && ^.^._id in applicableSports[]._ref]) == 0
      ] | order(slug.current asc) {
        _id,
        "name": coalesce(shortName, name),
        "slug": slug.current,
        "type": "division",
        "conferences": *[
          _type == "conference" &&
          _id in ^.^.conferenceIds &&
          // Transitional: also match the retired division field until
          // editorial-01 has run (see segmentIdsBySlug).
          (primaryClassification._ref == ^._id || division->slug.current == ^.slug.current)
        ] | order(name asc) { _id, name, shortName, "slug": slug.current }
      }
    )[count(conferences) > 0]
  }
`);

const rssFeedItemFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  ${postImageFragment},
  ${richTextFragment},
  "authors": authors[]->name,
  "sport": sport->title,
  "division": coalesce(classification, division)->name,
  "sportSubgrouping": coalesce(sportSubgrouping->shortName, sportSubgrouping->name),
  "conferences": conferences[]->{ name, shortName },
  "tags": tags[]->name,
`;

const rssFeedPostFilter = /* groq */ `_type == "post" && defined(slug.current) && defined(publishedAt)`;

export const rssFeedQuery = defineQuery(/* groq */ `
  *[${rssFeedPostFilter}] | order(publishedAt desc)[0...50] {
    ${rssFeedItemFragment}
  }
`);

// Extra conditions go in a chained filter: typegen drops the `defined()` narrowing when they share one.
export const rssFeedBySportQuery = defineQuery(/* groq */ `
  *[${rssFeedPostFilter}][sport._ref == ${sportIdBySlug}]
  | order(publishedAt desc)[0...50] {
    ${rssFeedItemFragment}
  }
`);

/** Matches `querySportsAndDivisionNews`: `$division` is a subgrouping or division slug, excluding the catch-all D1. */
export const rssFeedBySportAndDivisionQuery = defineQuery(/* groq */ `
  *[${rssFeedPostFilter}][
    sport._ref == ${sportIdBySlug} &&
    ${postInSegment} &&
    $division != "d1"
  ] | order(publishedAt desc)[0...50] {
    ${rssFeedItemFragment}
  }
`);

export const schoolsByIdQuery = defineQuery(
  /* groq */
  `*[_type == "school" && _id in $ids[].id]{
    _id,
    "_order": $ids[id == ^._id][0].rank,
    name,
    shortName,
    abbreviation,
    ${schoolImageFragment},
  }| order(_order)`,
);

export const sportInfoQuery = defineQuery(
  /* groq */
  `*[_type == "sport" && defined(slug.current)]{
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
  }`,
);

/**
 * Levels of play for the admin loader, shaped like the Postgres `divisions`
 * table it fills (which predates the `classification` type).
 */
export const divisionsQuery = defineQuery(/* groq */ `
  *[_type == "classification"]{
    _id,
    _createdAt,
    _updatedAt,
    "name": shortName,
    "title": name,
    "longName": name,
    "slug": slug.current,
    description
  }
  `);

export const conferencesQuery = defineQuery(/* groq */ `
  *[_type == "conference"]{
    _id,
    _createdAt,
    _updatedAt,
    name,
    shortName,
    abbreviation,
    "slug": slug.current,
    "divisionId": primaryClassification->_id,
    ${logoFragment},
    "sports": sports[]->_id
  }
  `);

export const schoolsQuery = defineQuery(/* groq */ `
  *[_type == "school"]{
    _id,
    _createdAt,
    _updatedAt,
    name,
    shortName,
    abbreviation,
    nickname,
    "slug": slug.current,
    top25VotingEligible,
    ${schoolImageFragment},
    conferenceAffiliations[] {
      "conferenceId": conference->_id,
      "sportId": sport->_id,
    }
  }
  `);

export const subdivisionsQuery = defineQuery(/* groq */ `
    *[_type == "sportSubgrouping"]{
    _id,
    _createdAt,
    _updatedAt,
    name,
    shortName,
    "slug": slug.current,
    "parentDivisionId": parentClassification->_id,
    "applicableSports": applicableSports[]->_id
  }
`);

export const schoolsByIdOrderedByPoints = groq`
*[_type == "school" && _id in $ids[].id]{
  _id,
  "_points": $ids[id == ^._id][0].totalPoints,
  name,
  shortName,
  abbreviation,
  ${schoolImageFragment},
} | order(_points desc)
`;

export const schoolWithVoteOrder = groq`
*[_type == "school" && _id in $ids[].teamId]{
  _id,
  "_order": $ids[teamId == ^._id][0].rank,
  name,
  shortName,
  abbreviation,
  ${schoolImageFragment},
} | order(_order)
`;

export const schoolsByIdsQuery = groq`
*[_type == "school" && _id in $ids]{
  _id,
  name,
  shortName,
  abbreviation,
  ${schoolImageFragment},
}
`;

export const postsSearchQuery = groq`
*[_type == 'post' && (
  title match "*" + $q + "*" ||
  excerpt match "*" + $q + "*" ||
  pt::text(body) match "*" + $q + "*" ||
  authors[]->name match "*" + $q + "*" ||
  conferences[]->name match "*" + $q + "*"
)] | score(
  boost(title match "*" + $q + "*", 5),
  boost(excerpt match "*" + $q + "*", 3),
  boost(pt::text(body) match "*" + $q + "*", 2),
) | order(_score desc, publishedAt desc)[0...5]{
  _id,
  title,
  _score,
  "slug": slug.current,
  publishedAt,
  excerpt
}`;

export const schoolsForVotesQuery = groq`*[_type == "school" && _id in $schoolIds]{
    _id,
    name,
    shortName,
    abbreviation,
    nickname,
    ${schoolImageFragment}
  }`;

export const postsForSitemapQuery = groq`
  *[_type == "post" && defined(publishedAt) && defined(slug.current)] | order(publishedAt asc, _id asc)[$start...$end]{
    _id,
    "slug": slug.current,
    publishedAt,
    // Editorial update time, not _updatedAt: bulk edits and typo fixes bump
    // _updatedAt, and Google stops trusting lastmod that moves without cause.
    "lastModified": coalesce(modifiedAt, publishedAt)
  }
`;

export const countOfPostsQuery = groq`
  count(*[_type == "post" && defined(slug.current) && defined(publishedAt)])
  `;

export const queryForCollegeSitemap = groq`
*[_type == "post" && defined(sport._ref) && defined(publishedAt)] | order(publishedAt desc){
  "sport": sport->slug.current,
  "division": coalesce(classification, division)->slug.current,
  "sportSubgrouping": sportSubgrouping->slug.current,
  "conferences": conferences[]->{
      "slug": slug.current,
      "division": primaryClassification->slug.current,
      "subgroupings": sportSubdivisionAffiliations[]{
        "sport": sport->slug.current,
        "subgrouping": subgrouping->slug.current
      }
    },
  _updatedAt
}`;

export const queryDivisionOrSubgroupingDisplayName = defineQuery(
  /* groq */
  `
  *[
    (_type == "sportSubgrouping" && lower(shortName) == lower($slugOrShortName)) ||
    (_type == "classification" && slug.current == $slugOrShortName)
  ][0]{
    _type,
    "displayName": select(
      _type == "sportSubgrouping" => shortName,
      _type == "classification" => name
    ),
    "archiveKicker": select(
      _type == "sportSubgrouping" => name,
      _type == "classification" => name
    )
  }
`,
);

export const schoolBySlugQuery = defineQuery(/* groq */ `
  *[
    _type == "school" &&
    slug.current == $slug
  ][0]{
    _id,
    name,
    shortName,
    abbreviation,
    nickname,
    "slug": slug.current,
    overview,
    websiteUrl,
    socialLinks,
    seoTitle,
    seoDescription,
    seoImage,
    ogTitle,
    ogDescription,
    ${schoolImageFragment},
    conferenceAffiliations[]{
      _key,
      subgroupingOverride->{ shortName, name, "slug": slug.current },
      sport->{
        _id,
        title,
        "slug": slug.current
      },
      conference->{
        _id,
        name,
        shortName,
        "slug": slug.current,
        primaryClassification->{ "slug": slug.current, name },
        sportSubdivisionAffiliations[]{
          sport->{ "slug": slug.current },
          subgrouping->{ shortName, name, "slug": slug.current }
        }
      }
    }
  }
`);

export const postsBySchoolQuery = defineQuery(/* groq */ `
  {
    "posts": *[${publishedPostsTaggingSchoolFilter}] | order(publishedAt desc)[$from...$to]{
      _id,
      title,
      excerpt,
      storyType,
      publishedAt,
      "slug": slug.current,
      ${postSportFragment},
      ${postImageFragment},
      ${postAuthorFragment}
    },
    "totalPosts": count(*[${publishedPostsTaggingSchoolFilter}])
  }
`);

export const postsBySchoolAndStoryTypeQuery = defineQuery(/* groq */ `
  *[
    ${publishedPostsTaggingSchoolFilter} &&
    storyType == $storyType
  ] | order(publishedAt desc)[0...6]{
    _id,
    title,
    excerpt,
    publishedAt,
    "slug": slug.current,
    ${postSportFragment},
    ${postImageFragment},
    ${postAuthorFragment}
  }
`);

export const postsByStoryTypeQuery = defineQuery(/* groq */ `
  {
    "posts": *[
      _type == "post" &&
      defined(publishedAt) &&
      storyType == $storyType &&
      ($sport == "" || sport->slug.current == $sport)
    ] | order(publishedAt desc)[$from...$to]{
      _id,
      title,
      excerpt,
      storyType,
      publishedAt,
      "slug": slug.current,
      ${postImageFragment},
      ${postAuthorFragment}
    },
    "totalPosts": count(*[
      _type == "post" &&
      defined(publishedAt) &&
      storyType == $storyType &&
      ($sport == "" || sport->slug.current == $sport)
    ])
  }
`);

export const schoolSlugsForSitemapQuery = groq`
  *[_type == "school" && defined(slug.current) && count(*[${publishedPostsTaggingSchoolFromParentFilter}]) >= $minPosts]{
    "slug": slug.current,
    // A team hub changes when a story about the school is published.
    "lastModified": coalesce(*[${publishedPostsTaggingSchoolFromParentFilter}] | order(publishedAt desc)[0].publishedAt, _updatedAt)
  }
`;

/** Resolve team hub slugs for schools that appear in rankings (by Sanity _id). */
export const schoolSlugsByIdsQuery = defineQuery(/* groq */ `
  *[_type == "school" && defined(slug.current) && _id in $ids]{
    _id,
    "slug": slug.current,
    "lastModified": coalesce(*[${publishedPostsTaggingSchoolFromParentFilter}] | order(publishedAt desc)[0].publishedAt, _updatedAt)
  }
`);

/**
 * Highest-priority live sponsorship for one placement.
 * `$includeScheduled` is true in draft preview so editors can see a flight
 * before its start date. An empty `$sportSlugs` list matches only sponsorships
 * that are not limited to a sport.
 */
export const queryActiveAdvertisement = defineQuery(/* groq */ `
  *[
    _type == "advertisement" &&
    active == true &&
    defined(image.asset) &&
    $placement in placements &&
    (
      $includeScheduled == true ||
      (
        (!defined(startsAt) || startsAt <= now()) &&
        (!defined(endsAt) || endsAt >= now())
      )
    ) &&
    (
      !defined(sports) ||
      count(sports) == 0 ||
      count(sports[@->slug.current in $sportSlugs]) > 0
    )
  ] | order(priority desc, _updatedAt desc)[0]{
    _id,
    sponsorName,
    "openInNewTab": url.openInNewTab,
    ${customUrlHrefFragment},
    image{
      ...,
      "id": asset._ref,
      "alt": coalesce(alt, asset->altText, ^.sponsorName, "Advertisement"),
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      hotspot { x, y, height, width },
      crop { bottom, left, right, top },
      "preview": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background
    }
  }
`);

/**
 * Google News sitemap: articles published in the last two days (Google
 * ignores older entries), newest first, capped at Google's 1,000.
 */
export const newsSitemapQuery = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    defined(slug.current) &&
    defined(publishedAt) &&
    dateTime(publishedAt) > dateTime(now()) - 60 * 60 * 48
  ] | order(publishedAt desc)[0...1000]{
    _id,
    title,
    publishedAt,
    "slug": slug.current
  }
`);
