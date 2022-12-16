import { groq } from 'next-sanity'

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
    "asset": mainImage.asset->{
      _id,
      _type,
      url,
      metadata
    }
  },
  category,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, socialMedia, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "parentSlug": @.reference->parent->slug.current,
        "slug": @.reference->slug
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
    "asset": mainImage.asset->{ 
      _id,
      _type,
      metadata,
      url
      }
  },
  category,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
`

export const settingsQuery = groq`*[_type == "settings"][0]`

export const postBySlugQuery = groq`
*[_type == "post" && slug.current == $slug][0] {
  ${postFields}
}
`

export const postSlugsQuery = groq`
*[_type == "post" && defined(slug.current)][].slug.current
`

export const homePageQuery = groq`
{
  'mainArticle': *[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0] {
    ${litePostFields}
  },
  "recentArticles": *[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[1..4] {
    ${litePostFields}
  },
  "otherArticles": *[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[5..10] {
    ${litePostFields}
  },
  "featuredArticles": *[_type == "post" && featuredArticle == true] | order(publishedAt desc, _updatedAt desc)[0..3] {
    ${litePostFields}
  },
}
`

export const postAndMoreStoriesQuery = groq`
*[_type == "post" && slug.current == $slug]{
  "post": {
    ${postFields}
  },
  "morePosts": *[_type == "post" && slug.current != $slug] | order(publishedAt desc, _updatedAt desc)[0...3] {
    ${postFields}
  }
}|order(publishedAt)[0]
`

export const allAuthorsQuery = groq`
*[_type == "author"] | order(_createdAt asc) {
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  "image": {
    "asset": image.asset->{_id, _type, metadata, url}
  },
  socialMedia,
}
`

export const privacyPolicyQuery = `
*[_type == "legal" && slug.current == "privacy-policy"][0] {
  _id,
  _updatedAt,
  title,
  slug,
  body
}
`

export const searchQuery = groq`
*[_type == 'post' && title match "*" + $query + "*"] | order(publishedAt desc, _updatedAt desc)[0..10]{
  ${litePostFields}
}
`
