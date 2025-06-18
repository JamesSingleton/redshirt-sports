import { defineQuery } from 'next-sanity'
import { perPage } from '../constants'

export const querySettingsData = defineQuery(/* groq */ `
  *[_type == "settings"][0]{
    _id,
    _type,
    siteTitle,
    siteDescription,
    "logo": logo.asset->url + "?w=80&h=40&dpr=3&fit=max",
    "socialLinks": socialLinks,
    "contactEmail": contactEmail,
  }
`)

const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      "href": select(
        reference->_type == "post" => "/" + reference->slug.current,
        "#"
      )
    }
  }
`

const imageFragment = /* groq */ `
  image{
    ...,
    "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
    "blurData": asset->metadata.lqip,
    "dominantColor": asset->metadata.palette.dominant.background,
  }
`

const postAuthorFragment = /* groq */ `
  authors[]->{
    ...,
    "slug": slug.current,
    ${imageFragment}
  }
`

const postImageFragment = /* groq */ `
  mainImage{
    ...,
    "alt": coalesce(asset->altText, caption, "Image-Broken"),
    "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    "blurData": asset->metadata.lqip,
    "dominantColor": asset->metadata.palette.dominant.background,
  }
`

const divisionFragment = /* groq */ `
  division->{
    _id,
    name,
    "slug": slug.current,
    logo{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
    }
  }
`

const conferencesFragment = /* groq */ `
  conferences[]->{
    _id,
    name,
    shortName,
    "slug": slug.current,
    logo{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
    },
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
`

const richTextFragment = /* groq */ `
  body[]{
    ...,
    ${markDefsFragment}
  }
`

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
    ${conferencesFragment},
    ${postAuthorFragment},
    ${postImageFragment},
    ${richTextFragment},
    "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
    "wordCount": length(pt::text(body)),
    // grab similar posts based on sport, and conferences and NOT division
    "relatedPosts": *[
      _type == "post"
      && _id != ^._id
      && (count(conferences[@._ref in ^.^.conferences[]._ref]) > 0 || count(tags[@._ref in ^.^.tags[]._ref]) > 0)
    ] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      publishedAt,
      ${postImageFragment},
      "slug": slug.current,
      authors[]->{
        _id,
        name,
        roles,
      }
    }[0...3]
  }
`)

export const querySportsNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->title match $sport] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      "author": author->{name, "slug": slug.current},
    },
    "totalPosts": count(*[_type == "post" && sport->title match $sport])
  }
`)

export const querySportsAndDivisionNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->title match $sport && division->slug.current == $division] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      "author": author->{name, "slug": slug.current},
    },
    "totalPosts": count(*[_type == "post" && sport->title match $sport && division->slug.current == $division])
  }
`)

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
        "href": select(
          url.type == "internal" && url.internalType == "reference" => url.internal->slug.current,
          url.type == "internal" && url.internalType == "custom" => url.internalUrl,
          url.type == "external" => url.external,
          url.href
        )
      }
    },
  }
`)

export const queryGlobalSeoSettings = defineQuery(`
  *[_type == "settings"][0]{
    _id,
    _type,
    siteTitle,
    logo{
      ...,
      ...asset->{
        "alt": coalesce(altText, originalFilename, "no-alt"),
        "blurData": metadata.lqip,
        "dominantColor": metadata.palette.dominant.background
      }
    },
    defaultOpenGraphImage{
      ...,
      ...asset->{
        "alt": coalesce(altText, originalFilename, "no-alt"),
        "blurData": metadata.lqip,
        "dominantColor": metadata.palette.dominant.background
      }
    },
    siteDescription,
    socialLinks{
      facebook,
      twitter,
      youtube
    }
  }
`)

export const queryNavbarData = defineQuery(/* groq */ `
  *[_type == "navbar" && _id == "navbar"][0]{
    _id,
    columns[]{
      _key,
      _type == "navbarColumn" => {
        "type": "column",
        title,
        links[]{
          _key,
          name,
          icon,
          description,
          "openInNewTab": url.openInNewTab,
          "href": select(
            url.type == "internal" && url.internalType == "reference" => url.internal->slug.current,
            url.type == "internal" && url.internalType == "custom" => url.internalUrl,
            url.type == "external" => url.external,
            url.href
          )
        }
      },
      _type == "navbarLink" => {
        "type": "link",
        name,
        description,
        "openInNewTab": url.openInNewTab,
        "href": select(
          url.type == "internal" && url.internalType == "reference" => url.internal->slug.current,
          url.type == "internal" && url.internalType == "custom" => url.internalUrl,
          url.type == "external" => url.external,
          url.href
        )
      }
    },
    "logo": *[_type == "settings"][0].logo.asset->url + "?w=70&h=40&dpr=3&fit=max",
    "siteTitle": *[_type == "settings"][0].siteTitle,
  }
`)

export const queryHomePageData = defineQuery(/* groq */ `
  *[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0...3]{
    _id,
    _type,
    title,
    excerpt,
    "slug": slug.current,
    mainImage{
      ...,
      "alt": coalesce(caption,asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    },
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
    author->{
      name,
      "slug": slug.current,
      image
    },
    authors[]->{
      name,
      "slug": slug.current,
      image
    }
  }
`)

export const queryLatestArticles = defineQuery(/* groq */ `
 *[_type == "post" && featuredArticle != true] | order(publishedAt desc)[3..6]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    publishedAt,
    mainImage{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    },
    division->{
      name,
      "slug": slug.current
    },
    conferences[]->{
      name,
      "slug": slug.current,
      shortName
    },
    author->{
      name,
      "slug": slug.current,
      image
    },
    authors[]->{
      name,
      "slug": slug.current,
      image
    }
  }
`)

export const queryLatestCollegeSportsArticles = defineQuery(/* groq */ `
  *[_type == "post" && division->name == $division && sport->title match $sport && !(_id in $articleIds)] | order(publishedAt desc)[0..4]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    mainImage{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    },
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
    authors[]->{
      name,
      "slug": slug.current,
      image{
        ...,
        "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
        "blurData": asset->metadata.lqip,
        "dominantColor": asset->metadata.palette.dominant.background,
        "credit": coalesce(asset->creditLine, attribution, "Unknown"),
      },
    }
  }
`)

export const queryCollegeSportsArticlesForSitemap = defineQuery(/* groq */ `
  *[_type == "post" && defined(slug.current) && sport->title match $sport] | order(publishedAt desc){
    _id,
    _updatedAt,
    publishedAt,
    "slug": slug.current,
`)

export const querySitemapData = defineQuery(/* groq */ `{
  "posts": *[_type == "post" && defined(slug.current)] {
    "slug": slug.current,
    "lastModified": _updatedAt
  },
  "authors": *[_type == "author" && defined(slug.current) && archived == false] {
    "slug": slug.current,
    "lastModified": _updatedAt
  },
  "sports": *[_type == "sport" && defined(title) && count(*[_type == "post" && references(^._id)]) > 0] {
    "slug": slug.current,
    "lastModified": _updatedAt
  },
}`)

export const queryArticlesBySportDivisionAndConference = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post"
      // 1. Filter by the main sport of the post
      && sport->title match $sport // e.g., "Football"

      // 2. Ensure the post references the specific conference by its slug
      && $conference in conferences[]->slug.current // e.g., "big-sky-conference"

      // 3. CRITICAL NEW LOGIC: Filter by division OR by subgrouping affiliation
      //    This handles cases where $division is a division slug (D2, D3)
      //    OR a sportSubgrouping shortName (FCS, FBS).
      && (
          // Path A: Post's primary division directly matches the $division slug
          // This covers "D2", "D3", and any legacy "FCS"/"FBS" division documents
          division->slug.current == $division
          
          || // OR

          // Path B: Post references a conference that is affiliated with a sportSubgrouping
          // whose shortName matches $division (case-insensitively) for this sport.
          // This covers "FCS", "FBS" when they are sportSubgroupings.
          references(
              *[_type == "conference"
                  && slug.current == $conference // Match the specific conference from the URL
                  // Check its sportSubdivisionAffiliations array
                  && count(sportSubdivisionAffiliations[
                      // The affiliation's sport reference must match the current sport ID
                      sport._ref == *[_type == "sport" && title match $sport][0]._id
                      // AND the affiliation's subgrouping reference must match the specified subgrouping ID
                      // We use lower() to handle potential case differences between URL param and shortName
                      && subgrouping._ref == *[_type == "sportSubgrouping" && lower(shortName) == lower($division)][0]._id
                  ]) > 0
              ]._id
          )
      )
    ] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      "author": author->{name, "slug": slug.current},
      "authors": authors[]->{name, "slug": slug.current},
    },
    // Conference info remains the same (uses $conference)
    "conferenceInfo": *[_type == "conference" && slug.current == $conference][0]{
      name,
      shortName,
    },
    // Total posts count needs to use the exact same combined filtering logic
    "totalPosts": count(*[_type == "post"
      && sport->title match $sport
      && $conference in conferences[]->slug.current
      && (
          division->slug.current == $division
          ||
          references(
              *[_type == "conference"
                  && slug.current == $conference
                  && count(sportSubdivisionAffiliations[
                      sport._ref == *[_type == "sport" && title match $sport][0]._id
                      && subgrouping._ref == *[_type == "sportSubgrouping" && lower(shortName) == lower($division)][0]._id
                  ]) > 0
              ]._id
          )
      )
    ])
  }
`)

export const searchQuery = defineQuery(/* groq */ `
{
  "posts": *[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")] | score(
    boost(title match $q, 4),
    boost(excerpt match $q, 3),
    boost(pt::text(body) match $q, 2),
  ) | order(publishedAt desc, _score desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ...,
    "slug": slug.current,
    ${divisionFragment},
    ${conferencesFragment},
    authors[]->{
      name,
      "slug": slug.current,
      image{
        ...,
        "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
        "blurData": asset->metadata.lqip,
        "dominantColor": asset->metadata.palette.dominant.background,
        "credit": coalesce(asset->creditLine, attribution, "Unknown"),
      },
    },
    "sport": sport->title,
  },
  "totalPosts": count(*[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")])
}
`)

export const sportInfoBySlug = defineQuery(/* groq */ `
*[_type == "sport" && slug.current == $slug][0]{
  _id,
  title,
}`)

export const authorBySlug = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug && archived == false][0]{
    ...,
    "slug": slug.current,
    ${imageFragment},
  }
`)

export const postsByAuthor = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug && archived == false][0]{
    "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      "slug": slug.current,
      ${postImageFragment},
      ${postAuthorFragment},
    },
    "totalPosts": count(*[_type == "post" && references(^._id)])
  }
`)

export const authorsListNotArchived = defineQuery(/* groq */ `
  *[_type == "author" && archived != true] | order(_createdAt asc, name asc) {
    _id,
    name,
    roles,
    "slug": slug.current,
    image{
      ...,
      "alt": coalesce(asset->altText, ^.name, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
    },
    socialMedia[]{
      _key,
      name,
      url
    }
  }
`)

export const privacyPolicyQuery = defineQuery(/* groq */ `
  *[_type == "legal" && slug.current == "privacy-policy"][0]
`)

export const schoolsByDivisionQuery = defineQuery(/* groq */ `
  *[_type == "school" && division->slug.current == $division && top25VotingEligible != false]| order(shortName asc){
  _id,
  name,
  shortName,
  abbreviation,
  image,
  conference->{
    name,
    shortName
  }
}
`)
