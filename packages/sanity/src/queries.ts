import { defineQuery, groq } from "next-sanity";

export const querySettingsData = defineQuery(/* groq */ `
  *[_type == "settings"][0]{
    _id,
    _type,
    siteBrand,
    siteTitle,
    siteDescription,
    "logo": logo.asset->url + "?w=80&h=40&dpr=3&fit=max",
    "socialLinks": socialLinks,
    "contactEmail": contactEmail,
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
    type == "internal" && internal->_type == "author" => "/authors/" + internal->slug.current,
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
    customLink.type == "internal" && customLink.internal->_type == "author" => "/authors/" + customLink.internal->slug.current,
    customLink.type == "internal" && customLink.internal->_type == "legal" => "/legal/" + customLink.internal->slug.current,
    customLink.href
  )
`;

const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
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
        reference->_type == "author" => "/authors/" + reference->slug.current,
        "#"
      )
    }
  }
`;

const customUrlHrefFragment = /* groq */ `
  "href": select(
    url.type == "external" => url.external,
    url.type == "internal" && url.internalType == "custom" => url.internalUrl,
    url.type == "internal" && url.internalType == "latestRankings" => null,
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "sportNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news",
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "divisionNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news/" + url.sportNewsLink.segment->slug.current,
    url.type == "internal" && url.internalType == "sportNews" && url.sportNewsLink.routeDepth == "conferenceNews" =>
      "/college/" + url.sportNewsLink.sport->slug.current + "/news/" + url.sportNewsLink.segment->slug.current + "/" + url.sportNewsLink.conference->slug.current,
    url.type == "internal" && url.internal->_type == "post" => "/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "school" => "/college/teams/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "author" => "/authors/" + url.internal->slug.current,
    url.type == "internal" && url.internal->_type == "legal" => "/legal/" + url.internal->slug.current,
    url.href
  )
`;

// The href depends on the newest poll in Postgres, so the app resolves it.
// Single-sport polls (FCS, FBS) skip the sport in the label; shared ones
// (Mid-Major, Division II) need it to be unambiguous.
const latestRankingsFragment = /* groq */ `
  "latestRankings": select(
    url.type == "internal" && url.internalType == "latestRankings" => {
      "sport": url.latestRankingsLink.sport->slug.current,
      "poll": url.latestRankingsLink.poll->slug.current,
      "label": "Latest " + select(
        count(url.latestRankingsLink.poll->applicableSports) == 1 => "",
        url.latestRankingsLink.sport->title + " "
      ) + coalesce(
        url.latestRankingsLink.poll->shortName,
        url.latestRankingsLink.poll->title,
        url.latestRankingsLink.poll->name
      ) + " rankings"
    }
  )
`;

const imageGeometryProjection = /* groq */ `
  "id": asset._ref,
  "alt": coalesce(caption, asset->altText, asset->originalFilename, "Image-Broken"),
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
  "image": coalesce(image, mainImage){
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

const postSportFragment = /* groq */ `
  sport->{
    _id,
    "slug": slug.current,
    title
  }
`;

export const queryImageType = defineQuery(`
  *[_type == "post" && defined(coalesce(image, mainImage))][0]{
    ${postImageFragment}
  }.image
`);

const divisionFragment = /* groq */ `
  division->{
    _id,
    name,
    "slug": slug.current,
    ${logoFragment}
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
    division->{
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
    ${postAuthorFragment},
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
    },
    "relatedPosts": *[
      _type == "post"
      && _id != ^._id
      && (count(conferences[@._ref in ^.^.conferences[]._ref]) > 0 || count(tags[@._ref in ^.^.tags[]._ref]) > 0)
    ] | order(publishedAt desc, _id desc)[0...5] {
      _id,
      title,
      publishedAt,
      ${postImageFragment},
      "slug": slug.current,
      ${postAuthorFragment}
    }

  }
`);

export const queryPostPaths = defineQuery(/* groq */ `
  *[_type == "post" && defined(slug.current)]| order(publishedAt desc)[0...50]{"slug": slug.current}
`);

/** Minimum published posts tagging a school before its team page is exposed. */
export const MIN_TEAM_PAGE_POSTS = 8;

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

/** Team hubs for the /college/teams index; mirrors `isTeamPageEligible`. */
export const queryTeamsIndex = defineQuery(/* groq */ `
  {
    "teams": *[
      _type == "school" &&
      defined(slug.current) &&
      (
        _id in $rankedIds ||
        count(*[${publishedPostsTaggingSchoolFromParentFilter}]) >= $minPosts
      )
    ] | order(coalesce(shortName, name) asc){
      _id,
      name,
      shortName,
      nickname,
      "slug": slug.current,
      ${schoolImageFragment},
      "affiliations": conferenceAffiliations[defined(sport) && defined(conference)]{
        "sport": sport->slug.current,
        "conference": conference->{ _id, name, shortName }
      }
    },
    "sports": *[_type == "sport" && defined(slug.current) && defined(title)] | order(title asc){
      "slug": slug.current,
      title
    }
  }
`);

export const querySportsNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->slug.current == $sport] | order(publishedAt desc)[$from...$to]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      ${postAuthorFragment}
    },
    "totalPosts": count(*[_type == "post" && sport->slug.current == $sport])
  }
`);

export const querySportsAndDivisionNews = defineQuery(/* groq */ `
  {
    "posts": *[
      _type == "post" &&
      sport->slug.current == $sport &&
      (sportSubgrouping->slug.current == $division || division->slug.current == $division) &&
      $division != "d1"
    ] | order(publishedAt desc)[$from...$to]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      ${postAuthorFragment}
    },
    "totalPosts": count(*[
      _type == "post" &&
      sport->slug.current == $sport &&
      (division->slug.current == $division || sportSubgrouping->slug.current == $division) &&
      $division != "d1"
    ])
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
  *[_type == "settings"][0]{
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

export const queryNavbarData = defineQuery(/* groq */ `
  *[_type == "navbar" && _id == "navbar"][0]{
    _id,
    "items": columns[]{
      _key,
      _type == "navbarColumn" => {
        "type": "menu",
        title,
        links[]{
          _key,
          name,
          description,
          "openInNewTab": url.openInNewTab,
          ${customUrlHrefFragment},
          ${latestRankingsFragment}
        }
      },
      _type == "navbarLink" => {
        "type": "link",
        name,
        "openInNewTab": url.openInNewTab,
        ${customUrlHrefFragment},
        ${latestRankingsFragment}
      }
    },
    secondaryLinks[]{
      _key,
      name,
      "openInNewTab": url.openInNewTab,
      ${customUrlHrefFragment},
      ${latestRankingsFragment}
    },
    cta{
      name,
      "openInNewTab": url.openInNewTab,
      ${customUrlHrefFragment},
      ${latestRankingsFragment}
    },
    "logo": *[_type == "settings"][0].footerLogo{
      ...,
      ${coreImageMetadataProjection}
    },
    "logoDark": *[_type == "settings"][0].footerLogoDarkMode{
      ...,
      ${coreImageMetadataProjection}
    },
  }
`);

export const queryHomePageData = defineQuery(/* groq */ `
  *[_type == "post"] | order(publishedAt desc)[0...7]{
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

export const queryLatestArticles = defineQuery(/* groq */ `
 *[_type == "post"] | order(publishedAt desc)[7...11]{
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
  *[_type == "post" && (division->name == $division || sportSubgrouping->name == $division) && sport->title match $sport && !(_id in $articleIds)] | order(publishedAt desc)[0..4]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    ${postImageFragment},
    publishedAt,
    division->{
      name,
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

export const queryCollegeSportsArticlesForSitemap = defineQuery(/* groq */ `
  *[_type == "post" && defined(slug.current) && sport->title match $sport] | order(publishedAt desc){
    _id,
    _updatedAt,
    publishedAt,
    "slug": slug.current,
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

export const queryArticlesBySportDivisionAndConference =
  defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->slug.current == $sport && $conference in conferences[]->slug.current && (
      sportSubgrouping->slug.current == $division || division->slug.current == $division
    ) && $conference in *[_type == "conference" && slug.current == $conference && (count(sportSubdivisionAffiliations[sport->slug.current == $sport && subgrouping->slug.current == $division]) > 0 || (division->slug.current == $division && division->slug.current != 'd1'))].slug.current] | order(publishedAt desc) [$from...$to]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      ${postAuthorFragment}
    },
    "conferenceInfo": *[_type == "conference" && slug.current == $conference && (count(sportSubdivisionAffiliations[sport->slug.current == $sport && subgrouping->slug.current == $division]) > 0 || (division->slug.current == $division && division->slug.current != 'd1'))][0]{
      _id,
      name,
      shortName
    },
    "totalPosts": count(*[_type == "post" && sport->slug.current == $sport && $conference in conferences[]->slug.current && (
      sportSubgrouping->slug.current == $division || division->slug.current == $division
    ) && $conference in *[_type == "conference" && slug.current == $conference && (count(sportSubdivisionAffiliations[sport->slug.current == $sport && subgrouping->slug.current == $division]) > 0 || (division->slug.current == $division && division->slug.current != 'd1'))].slug.current]),
  }
`);

export const queryDivisionConferenceFilters = defineQuery(/* groq */ `
  *[
    _type == "conference" &&
    (
      count(sportSubdivisionAffiliations[sport->slug.current == $sport && subgrouping->slug.current == $division]) > 0 ||
      (division->slug.current == $division && $division != "d1")
    ) &&
    count(*[_type == "post" && sport->slug.current == $sport && references(^._id)]) > 0
  ] | order(coalesce(shortName, name) asc){
    _id,
    "name": coalesce(shortName, name),
    "fullName": name,
    "slug": slug.current
  }
`);

const sportHubPostFields = /* groq */ `
  _id,
  title,
  excerpt,
  "slug": slug.current,
  ${postImageFragment},
  publishedAt,
  conferences[]->{
    name,
    shortName
  },
  ${postAuthorFragment}
`;

export const querySportHubData = defineQuery(/* groq */ `
  {
    "sport": *[_type == "sport" && slug.current == $sport][0]{
      _id,
      title,
      "slug": slug.current
    },
    "latest": *[_type == "post" && sport->slug.current == $sport] | order(publishedAt desc)[0...5]{
      ${sportHubPostFields}
    },
    "groups": *[
      (_type == "sportSubgrouping" || (_type == "division" && slug.current != "d1")) &&
      count(*[_type == "post" && sport->slug.current == $sport && (sportSubgrouping._ref == ^._id || division._ref == ^._id)]) > 0
    ] | order(select(slug.current == "fcs" => 0, slug.current == "fbs" => 1, _type == "sportSubgrouping" => 2, 3), name asc){
      _id,
      "name": coalesce(title, name),
      "shortName": coalesce(shortName, title, name),
      "slug": slug.current,
      "posts": *[
        _type == "post" &&
        sport->slug.current == $sport &&
        (sportSubgrouping._ref == ^._id || division._ref == ^._id)
      ] | order(publishedAt desc)[0...10]{
        ${sportHubPostFields}
      }
    }
  }
`);

export const querySportFilters = defineQuery(/* groq */ `
  *[_type == "sport" && count(*[_type == "post" && sport._ref == ^._id]) > 0] | order(title asc){
    _id,
    title,
    "slug": slug.current
  }
`);

export const querySportDivisionFilters = defineQuery(/* groq */ `
  {
    "subgroupings": *[
      _type == "sportSubgrouping" &&
      count(*[_type == "post" && sport->slug.current == $sport && sportSubgrouping._ref == ^._id]) > 0
    ] | order(name asc){
      _id,
      "name": coalesce(shortName, name),
      "slug": slug.current
    },
    "divisions": *[
      _type == "division" &&
      slug.current != "d1" &&
      count(*[_type == "post" && sport->slug.current == $sport && division._ref == ^._id]) > 0
    ] | order(name asc){
      _id,
      "name": coalesce(title, name),
      "slug": slug.current
    }
  }
`);

export const searchQuery = defineQuery(/* groq */ `
{
  "posts": *[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")] | score(
    boost(title match $q, 4),
    boost(excerpt match $q, 3),
    boost(pt::text(body) match $q, 2),
  ) | order(publishedAt desc, _score desc)[$from...$to]{
    _id,
    title,
    publishedAt,
    "slug": slug.current,
    ${postImageFragment},
    "authors": authors[]->{ _id, name },
  },
  "totalPosts": count(*[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")])
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
    "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[$from...$to]{
      _id,
      title,
      publishedAt,
      "slug": slug.current,
      ${postImageFragment},
      "authors": authors[]->{ _id, name },
    },
    "totalPosts": count(*[_type == "post" && references(^._id)])
  }
`);

const teamAuthorFilter = /* groq */ `_type == "author" && archived != true && slug.current != "redshirt-sports"`;

const teamAuthorProjection = /* groq */ `{
    _id,
    name,
    roles,
    "slug": slug.current,
    ${authorListImageFragment},
    socialLinks
  }`;

/** Staff list; the house "Redshirt Sports" byline is not a person. */
export const authorsListNotArchived = defineQuery(/* groq */ `
  *[${teamAuthorFilter}] | order(_createdAt asc, name asc) ${teamAuthorProjection}
`);

/** Staff with a story in the last 12 months; founders always appear. */
export const queryRecentContributors = defineQuery(/* groq */ `
  *[${teamAuthorFilter} && (
    "Founder" in roles ||
    count(*[_type == "post" && references(^._id) && dateTime(publishedAt) > dateTime(now()) - 60 * 60 * 24 * 365]) > 0
  )] | order(_createdAt asc, name asc) ${teamAuthorProjection}
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

export const schoolsByDivisionQuery = defineQuery(/* groq */ `
  *[_type == "school" && division->slug.current == $division && top25VotingEligible != false]| order(shortName asc){
  _id,
  name,
  shortName,
  abbreviation,
  ${schoolImageFragment},
  conference->{
    name,
    shortName
  }
}
`);

export const schoolsBySportAndSubgroupingStringQuery = defineQuery(/* groq */ `
  *[_type == "school"
  ] {
    _id,
    name,
    shortName,
    abbreviation,
    ${schoolImageFragment},
    conferenceAffiliations,
    "relevantAffiliation": conferenceAffiliations[sport->slug.current == $sport][0]
  }[defined(relevantAffiliation)] {
    _id,
    name,
    shortName,
    abbreviation,
    ${schoolImageFragment},
    relevantAffiliation,
    "conferenceDetails": *[_type == "conference" && _id == ^.relevantAffiliation.conference._ref][0] {
      name,
      shortName,
      abbreviation,
      sportSubdivisionAffiliations
    }
  }[
    count(conferenceDetails.sportSubdivisionAffiliations[
      sport->slug.current == $sport &&
      subgrouping->slug.current == $subgrouping
    ]) > 0
  ] | order(shortName asc) {
    _id,
    name,
    shortName,
    abbreviation,
    ${schoolImageFragment},
    "conferenceInfo": {
      "conference": conferenceDetails {
        name,
        shortName,
        abbreviation
      }
    }
  }
`);

export const collegeNewsQuery = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post"] | order(publishedAt desc)[$from...$to] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      ${postAuthorFragment},
      ${postImageFragment}
    },
    "totalPosts": count(*[_type == "post"])
  }
`);

export const conferenceInfoBySlugQuery = defineQuery(/* groq */ `
  *[_type == "conference" && slug.current == $slug][0]
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
  "division": division->title,
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
  *[${rssFeedPostFilter}][sport->slug.current == $sport]
  | order(publishedAt desc)[0...50] {
    ${rssFeedItemFragment}
  }
`);

/** Matches `querySportsAndDivisionNews`: `$division` is a subgrouping or division slug, excluding the catch-all D1. */
export const rssFeedBySportAndDivisionQuery = defineQuery(/* groq */ `
  *[${rssFeedPostFilter}][
    sport->slug.current == $sport &&
    (sportSubgrouping->slug.current == $division || division->slug.current == $division) &&
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

export const divisionsQuery = defineQuery(/* groq */ `
  *[_type == "division"]{
    _id,
    _createdAt,
    _updatedAt,
    name,
    title,
    heading,
    longName,
    "slug": slug.current,
    description,
    ${logoFragment}
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
    "divisionId": division->_id,
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
    "parentDivisionId": parentDivision->_id,
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
  *[_type == "post" && defined(publishedAt) && defined(slug.current)][$start...$end]{
    _id,
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }
`;

export const countOfPostsQuery = groq`
  count(*[_type == "post" && defined(slug.current) && defined(publishedAt)])
  `;

export const queryForCollegeSitemap = groq`
*[_type == "post" && defined(sport->slug.current)] | order(publishedAt desc){
  "sport": sport->slug.current,
  "division": division->slug.current,
  "sportSubgrouping": sportSubgrouping->slug.current,
  "conferences": conferences[]->{
      "slug": slug.current,
      "division": division->slug.current,
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
    (_type == "division" && slug.current == $slugOrShortName)
  ][0]{
    _type,
    "displayName": select(
      _type == "sportSubgrouping" => shortName,
      _type == "division" => title
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
    "postCount": count(*[${publishedPostsTaggingSchoolFromParentFilter}]),
    ${schoolImageFragment},
    conferenceAffiliations[]{
      _key,
      sport->{
        _id,
        title,
        "slug": slug.current
      },
      conference->{
        _id,
        name,
        shortName,
        "slug": slug.current
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
    _updatedAt
  }
`;

/** Resolve team hub slugs for schools that appear in rankings (by Sanity _id). */
export const schoolSlugsByIdsQuery = defineQuery(/* groq */ `
  *[_type == "school" && defined(slug.current) && _id in $ids]{
    _id,
    "slug": slug.current,
    _updatedAt
  }
`);
