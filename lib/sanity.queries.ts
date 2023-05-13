import { groq } from 'next-sanity'

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
  "image": {
    "asset": image.asset->{ 
      _id,
      _type,
      metadata,
      url
      }
  },
  bio,
  socialMedia,
`

export const allAuthors = groq`
*[_type == 'author' && archived == false] | order(_createdAt asc){
  ${authorFields}
}
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

export const categoryBySlugQuery = groq`
*[_type == "category" && slug.current == $slug][0]{
  _id,
  title,
  pageHeader,
  subTitle,
  "slug": slug.current,
  description,
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * 10)...$pageIndex * 10]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}`

export const subcategoryBySlugQuery = groq`
*[_type == "category" && defined(parent->slug.current) && slug.current == $slug && count(*[_type == 'post' && references(^._id)]) > 0][0]{
  _id,
  title,
  pageHeader,
  subTitle,
  _updatedAt,
  "parentSlug": parent->slug.current,
  "parentTitle": parent->title,
  "slug": slug.current,
  description,
  "posts": *[_type == 'post' && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * 10)...$pageIndex * 10]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}`

export const authors = groq`
  *[_type == 'author' && slug.current == $slug && archived == false][0]{
    ${authorFields}
    "posts": *[_type == 'post' && references(^._id)] | order(publishedAt desc, _updatedAt desc)[(($pageIndex - 1) * 10)...$pageIndex * 10]{
      ${litePostFields}
    },
    "totalPosts": count(*[_type == 'post' && references(^._id)])
  }
`
export const postsForRssFeed = groq`
*[_type == 'post']{
  _id,
  'slug': slug.current,
  publishedAt,
  _updatedAt,
  title,
  excerpt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "asset": mainImage.asset->{ 
      _id,
      _type,
      metadata,
      url
     }
  },
  "author": author->{name, 'slug': slug.current},
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "slug": @.reference->slug
      }
    }
  },
}
`

export const parentCategorySlugQuery = groq`
*[_type == "category" && defined(slug.current) && !defined(parent)]{
  'slug': slug.current
}`

export const subCategorySlugQuery = groq`
*[_type == "category" && defined(slug.current) && defined(parent)]{
  'slug': slug.current,
  'parentSlug': parent->slug.current
}`

export const postSlugsQuery = `
*[_type == "post" && defined(slug.current)][].slug.current
`

export const categoriesQuery = groq`
*[_type == "category" && defined(slug.current) && !defined(parent) && count(*[_type == 'post' && references(^._id)]) > 0]| order(_createdAt asc){
  _id,
  title,
  "slug": slug.current,
  "subcategories": *[_type == "category" && defined(slug.current) && defined(parent) && parent->slug.current == ^.slug.current] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    "parentSlug": parent->slug.current,
  }
}`

// query to get all posts, authors, categories, and subcategories for sitemap
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
  "categories": *[_type == "category" && defined(slug.current) && !defined(parent) && count(*[_type == 'post' && references(^._id)]) > 0]{
    _id,
    _updatedAt,
    "slug": slug.current
  },
  "subcategories": *[_type == "category" && defined(slug.current) && defined(parent)]{
    _id,
    _updatedAt,
    "slug": slug.current,
    "parentSlug": parent->slug.current,
  }
}
`
