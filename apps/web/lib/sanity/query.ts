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
    "alt": coalesce(asset->altText, caption, asset->originalFilename, "Image-Broken"),
    "credit": coalesce(asset->creditLine, attribution, "Unknown"),
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
    ${markDefsFragment},
    _type == 'image' => {
      ...,
      "alt": coalesce(asset->altText, caption, asset->originalFilename, "Image-Broken"),
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
    },
    _type == 'top25Table' => {
      ...,
      votes[]{
        ...,
        teams[]->{
          ...,
          ${imageFragment}
        }
      }
    }
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
      ${postAuthorFragment}
    }[0...3]
  }
`)

export const queryPostPaths = defineQuery(/* groq */ `
  *[_type == "post" && defined(slug.current)]| order(publishedAt desc)[0...50]{"slug": slug.current}
`)

export const queryAuthorPaths = defineQuery(/* groq */ `
  *[_type == "author" && defined(slug.current) && archived == false]| order(_createdAt desc)[0...20]{"slug": slug.current}
`)

export const querySportsNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->slug.current == $sport] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      ${postImageFragment},
      "slug": slug.current,
      ${postAuthorFragment}
    },
    "totalPosts": count(*[_type == "post" && sport->slug.current == $sport])
  }
`)

export const querySportsAndDivisionNews = defineQuery(/* groq */ `
  {
    "posts": *[
      _type == "post" &&
      sport->slug.current == $sport &&
      (sportSubgrouping->slug.current == $division || division->slug.current == $division) &&
      $division != "d1"
    ] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
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

export const queryGlobalSeoSettings = defineQuery(/* groq */ `
  *[_type == "settings"][0]{
    _id,
    _type,
    siteBrand,
    siteTitle,
    siteDescription,
    logo{
      ...,
      ...asset->{
        "alt": coalesce(altText, originalFilename, "no-alt"),
        "blurData": metadata.lqip,
        "dominantColor": metadata.palette.dominant.background
      }
    },
    footerLogo{
      ...,
      ...asset->{
        "alt": coalesce(altText, originalFilename, "no-alt"),
        "blurData": metadata.lqip,
        "dominantColor": metadata.palette.dominant.background
      }
    },
    footerLogoDarkMode{
      ...,
      ...asset->{
        "alt": coalesce(altText, originalFilename, "no-alt"),
        "blurData": metadata.lqip,
        "dominantColor": metadata.palette.dominant.background
      }
    },
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
    ${postAuthorFragment}
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
    ${postAuthorFragment}
  }
`)

export const queryLatestCollegeSportsArticles = defineQuery(/* groq */ `
  *[_type == "post" && (division->name == $division || sportSubgrouping->name == $division) && sport->title match $sport && !(_id in $articleIds)] | order(publishedAt desc)[0..4]{
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
    ${postAuthorFragment}
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
  "sports": *[_type == "sport" && defined(slug.current) && count(*[_type == "post" && references(^._id)]) > 0] {
    "slug": slug.current,
    "lastModified": _updatedAt
  }
}`)

export const queryArticlesBySportDivisionAndConference = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->slug.current == $sport && $conference in conferences[]->slug.current && (
      sportSubgrouping->slug.current == $division || division->slug.current == $division
    ) && $conference in *[_type == "conference" && slug.current == $conference && (count(sportSubdivisionAffiliations[sport->slug.current == $sport && subgrouping->slug.current == $division]) > 0 || (division->slug.current == $division && division->slug.current != 'd1'))].slug.current] | order(publishedAt desc) [(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
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
    ${postAuthorFragment},
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
    socialLinks
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

export const schoolsBySportAndSubgroupingStringQuery = defineQuery(/* groq */ `
  *[_type == "school" &&
    top25VotingEligible != false
  ] {
    _id,
    name,
    shortName,
    abbreviation,
    ${imageFragment},
    conferenceAffiliations,
    "relevantAffiliation": conferenceAffiliations[sport->slug.current == $sport][0]
  }[defined(relevantAffiliation)] {
    _id,
    name,
    shortName,
    abbreviation,
    ${imageFragment},
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
    ${imageFragment},
    "conferenceInfo": {
      "conference": conferenceDetails {
        name,
        shortName,
        abbreviation
      }
    }
  }
`)

export const collegeNewsQuery = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post"] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      ${postAuthorFragment},
      ${postImageFragment}
    },
    "totalPosts": count(*[_type == "post"])
  }
`)

export const conferenceInfoBySlugQuery = defineQuery(/* groq */ `
  *[_type == "conference" && slug.current == $slug][0]
`)

export const globalNavigationQuery = defineQuery(/* groq */ `
  *[_type == "sport" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc) {
    _id,
    "name": title,
    "slug": slug.current,
    "groupings": select(
      slug.current == "football" => [
        // FBS Subgrouping
        *[_type == "sportSubgrouping" && shortName == "FBS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
          _id,
          "name": coalesce(shortName, name),
          "slug": slug.current,
          "type": "subgrouping",
          "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
            _id,
            name,
            "slug": slug.current,
            shortName
          }
        },
        // FCS Subgrouping
        *[_type == "sportSubgrouping" && shortName == "FCS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
          _id,
          "name": coalesce(shortName, name),
          "slug": slug.current,
          "type": "subgrouping",
          "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
            _id,
            name,
            "slug": slug.current,
            shortName
          }
        },
        // Division II
        *[_type == "division" && title == "Division II" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
          _id,
          "name": name,
          "slug": slug.current,
          "type": "division",
          "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
            _id,
            name,
            "slug": slug.current,
            shortName
          }
        },
        // Division III
        *[_type == "division" && title == "Division III" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
          _id,
          "name": name,
          "slug": slug.current,
          "type": "division",
          "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
            _id,
            name,
            "slug": slug.current,
            shortName
          }
        }
      ],
      true => (
        // Generic subgroupings
        *[_type == "sportSubgrouping" && ^._id in applicableSports[]._ref] | order(name asc) {
          _id,
          "name": coalesce(shortName, name),
          "slug": slug.current,
          "type": "subgrouping",
          "conferences": *[_type == "conference" && count(sportSubdivisionAffiliations[subgrouping._ref == ^.^._id && sport._ref == ^.^.^._id]) > 0 && count(*[_type == "post" && references(^._id) && sport._ref == ^.^.^._id]) > 0] | order(name asc) {
            _id,
            name,
            shortName,
            "slug": slug.current
          }
        } +
        // Generic divisions (excluding specific football and basketball divisions)
        *[_type == "division"
          && !(title == "FBS" || title == "FCS")
          && !(
            (title == "Division I")
            && (
              ^.slug.current == "mens-basketball" || ^.slug.current == "womens-basketball"
            )
          )
        ] | order(name asc) {
          _id,
          "name": title,
          "slug": slug.current,
          "type": "division",
          "conferences": *[_type == "conference" && division._ref == ^.^._id && count(*[_type == "post" && references(^._id) && sport->slug.current == ^.^.slug.current]) > 0] | order(name asc) {
            _id,
            name,
            shortName,
            "slug": slug.current
          }
        }
      )[defined(conferences) && count(conferences) > 0]
    )
  }
`)

export const rssFeedQuery = defineQuery(
  /* groq */
  `*[_type == "post"][0..50] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  ${postImageFragment},
}
`,
)

export const schoolsByIdQuery = defineQuery(
  /* groq */
  `*[_type == "school" && _id in $ids[].id]{
    _id,
    "_order": $ids[id == ^._id][0].rank,
    name,
    shortName,
    abbreviation,
    image,
  }| order(_order)`,
)
