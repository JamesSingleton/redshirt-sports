import { groq } from 'next-sanity'

import { perPage } from './constants'

const legalFields = `
  _id,
  _updatedAt,
  title,
  slug,
  body
`

const authorFields = `
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  image,
  bio,
  socialMedia
`

export const allAuthors = groq`
*[_type == 'author' && archived != true] | score(
  boost(role == 'Staff Writer', 4),
  boost(role == 'Content Writer', 3),
  boost(role == 'Contributor', 2),
  boost(role == 'Freelancer', 1),
) | order(_score desc, name asc){
  ${authorFields}
}
`

export const privacyPolicy = groq`
*[_type == "legal" && slug.current == "privacy-policy"][0] {
  ${legalFields}
}
`

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "crop": mainImage.crop,
    "hotspot": mainImage.hotspot,
    "asset": mainImage.asset->
  },
  division->{
    name,
    "slug": slug.current,
  },
  conferences[]->{
    name,
    shortName,
    "slug": slug.current,
  },
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, socialMedia, image, archived},
  excerpt,
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        reference->{
          _type,
          "slug": slug.current,
          "divisionSlug": division->slug.current,
        }
      }
    }
  },
  featuredArticle,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "wordCount": length(pt::text(body))
`

const litePostFields = `
  _id,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "crop": mainImage.crop,
    "hotspot": mainImage.hotspot,
    "asset": mainImage.asset->{
      _id,
      _type,
      url,
      metadata
    },
  },
  division->{
    name,
    "slug": slug.current,
    longName
  },
  conferences[]->{
    _id,
    name,
    shortName,
    "slug": slug.current,
  },
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, archived, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
`

export const heroPostsQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0...3] {
  ${litePostFields}
}
`

export const latestArticlesForHomePageQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[3..6] {
  ${litePostFields}
}
`

export const postsBySlugQuery = groq`
*[_type == "post" && slug.current == $slug][0]{
  ${postFields},
  "relatedArticles": *[
    _type == "post"
    && _id != ^._id
    && count(conferences[@._ref in ^.^.conferences[]._ref]) > 0
  ] | order(publishedAt desc, _createdAt desc) {
    ${litePostFields}
  }[0...3]
}
`

export const latestDivisionArticlesQuery = groq`
*[_type == "post" && division->name == $division && !(_id in $ids)] | order(publishedAt desc, _updatedAt desc)[0...5] {
  ${litePostFields}
}
`

export const heroArticleQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc) [0] {
  ${litePostFields}
}`

export const recentArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[1..2] {
  ${litePostFields}
}
`

export const featuredArticlesQuery = groq`
*[_type == "post" && featuredArticle == true] | order(publishedAt desc, _updatedAt desc)[0..3] {
  ${litePostFields}
}
`

export const otherArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[3..6] {
  ${litePostFields}
}
`

export const authorBySlug = groq`
  *[_type == 'author' && slug.current == $slug && archived == false][0]{
    ${authorFields}
  }
`

export const conferencesAuthorHasWrittenFor = groq`
*[_id == $authorId][0] {
  "conferences": array::unique(*[_id in *[_type == "post" && references($authorId)].conferences[]._ref])[] {
    _id,
    "path": "/news/" + division->.slug.current + "/" + slug.current,
    name,
    shortName,
  } | order(name asc)
}
`

export const authorsPosts = groq`
*[_id == $authorId][0]{
  "posts": *[_type == 'post' && references(^._id) && select(
    $conference == null => true,
    $conference in conferences[]->name
  )] | order(publishedAt desc, _updatedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == 'post' && references(^._id) && select(
    $conference == null => true,
    $conference in conferences[]->name
  )])
}
`

export const postsForRssFeed = groq`
*[_type == 'post']{
  ...,
  'slug': slug.current,
  'author': author->{name, 'slug': slug.current},
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "parentSlug": @.reference->parent->slug.current,
        "slug": @.reference->slug
      }
    }
  }
}
`

export const postPaths = `
*[_type == "post" && defined(slug.current)][].slug.current
`

export const divisionPaths = `
*[_type == "division" && defined(slug.current)][].slug.current
`

// create a query that returns the conference slugs concatenated with the division slug where there's at least 1 article that references that conference
export const conferencePaths = groq`
*[_type == "conference" && defined(slug.current) && defined(division) && count(*[_type == 'post' && references(^._id)]) > 0]{
  "slug": slug.current,
  "divisionSlug": division->slug.current,
}
`

export const authorSlugsQuery = groq`
*[_type == "author" && defined(slug.current) && archived == false][].slug.current`

export const sitemapQuery = groq`
{
  "posts": *[_type == 'post' && defined(slug.current)]{
    _id,
    _updatedAt,
    "slug": slug.current,
  },
  "authors": *[_type == 'author' && defined(slug.current) && archived == false]{
    _id,
    _updatedAt,
    "slug": slug.current,
  },
  "divisions": *[_type == "division" && defined(slug.current) && count(*[_type == 'post' && references(^._id)]) > 0]{
    _id,
    _updatedAt,
    "slug": slug.current
  },
  "conferences": *[_type == "conference" && defined(slug.current) && defined(division) && count(*[_type == 'post' && references(^._id)]) > 0]{
    _id,
    _updatedAt,
    "slug": slug.current,
    "divisionSlug": division->slug.current,
  }
}
`

export const transferPortalPlayers = groq`
  *[_type == 'transferPortal']{
    ...,
    "player": player->{
      ...
    },
    "transferringFrom": transferringFrom->{
      ...
    },
    "transferringTo": transferringTo->{
      ...
    },
  }
`

export const divisionsQuery = groq`
*[_type == "division" && count(*[_type == 'post' && references(^._id)]) > 0]{
  ...,
  "slug": slug.current,
  "conferences": *[_type == "conference" && division._ref == ^._id && count(*[_type == 'post' && references(^._id)]) > 0]{
    ...,
    "slug": slug.current,
  } | order(name asc)
} | order(name desc)
`

export const divisionBySlugQuery = groq`
*[_type == "division" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}
`

export const conferenceBySlugQuery = groq`
*[_type == "conference" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "division": division-> {
    name,
    "slug": slug.current,
  },
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}
`

export const paginatedPostsQuery = groq`
  {
    "posts": *[_type == "post"] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ${litePostFields}
    },
    "totalPosts": count(*[_type == "post"])
  }
`

// create a search query that includes totalPosts for the search results
export const searchQuery = groq`
{
  "posts": *[_type == 'post' && (title match "*" + $query + "*" || excerpt match "*" + $query + "*" || pt::text(body) match "*" + $query + "*")] | score(
    boost(title match $query, 4),
    boost(excerpt match $query, 3),
    boost(pt::text(body) match $query, 2),
  ) | order(_score desc, publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == 'post' && (title match "*" + $query + "*" || excerpt match "*" + $query + "*" || pt::text(body) match "*" + $query + "*")])
}
`
