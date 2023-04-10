import { groq } from 'next-sanity'

export const allAuthors = groq`
*[_type == 'author'] | order(_createdAt asc){
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  image,
  socialMedia
}
`

const legalFields = `
  _id,
  _updatedAt,
  title,
  slug,
  body
`

export const privacyPolicy = groq`
*[_type == "legal" && slug.current == "privacy-policy"][0] {
  ${legalFields}
}
`

export const advertisingPage = groq`
*[_type == "legal" && slug.current == "advertising"][0] {
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
    "asset": mainImage.asset->{
      _id,
      _type,
      url,
      metadata
    }
  },
  category,
  "subcategory": subcategory->{title, 'slug': slug.current, "parentSlug": parent->slug.current,
  "parentTitle": parent->title,},
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, socialMedia, image},
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
  "subcategory": subcategory->{title, 'slug': slug.current, "parentSlug": parent->slug.current,
  "parentTitle": parent->title,},
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
`

export const postsBySlugQuery = groq`
*[_type == "post" && slug.current == $slug]{
  ${postFields}
}[0]
`

export const morePostsBySlugQuery = groq`
*[_type == "post" && slug.current != $slug]{
  ${postFields}
}| order(publishedAt desc) [0...3]`

export const heroArticleQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc) [0] {
  ${litePostFields}
}`

export const recentArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[1..4] {
  ${litePostFields}
}
`

export const featuredArticlesQuery = groq`
*[_type == "post" && featuredArticle == true] | order(publishedAt desc, _updatedAt desc)[0..3] {
  ${litePostFields}
}
`

export const otherArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[5..10] {
  ${litePostFields}
}
`
