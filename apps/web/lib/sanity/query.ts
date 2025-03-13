import { defineQuery } from "next-sanity";
import { perPage } from "../constants";

const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
    _type == "internalLink" => {
      ...,
      "href": select(
        reference->_type == "division" => "/news/" + reference->slug.current,
        reference->_type == "conference" => "/news/" + reference->division->slug.current + "/" + reference->slug.current,
        reference->_type == "article" => "/" + reference->slug.current,
        "#"
      )
    }
  }
`;

const imageFragment = /* groq */ `
  image{
    ...,
    "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
    "blurData": asset->metadata.lqip,
    "dominantColor": asset->metadata.palette.dominant.background,
  }
`;

const postAuthorFragment = /* groq */ `
  authors[]->{
    _id,
    name,
    roles,
    ${imageFragment}
  }
`;

const postImageFragment = /* groq */ `
  mainImage{
    ...,
    "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
    "blurData": asset->metadata.lqip,
    "dominantColor": asset->metadata.palette.dominant.background,
  }
`;

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
`;

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
    }
  }
`;

const richTextFragment = /* groq */ `
  body[]{
    ...,
    ${markDefsFragment}
  }
`;

export const queryPostSlugData = defineQuery(/* groq */ `
  *[_type == "post" && slug.current == $slug][0]{
    ...,
    "slug": slug.current,
    ${divisionFragment},
    ${conferencesFragment},
    ${postAuthorFragment},
    ${postImageFragment},
    ${richTextFragment}
  }
`);

export const querySportsNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->title match $sport] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      division->{
        name,
        "slug": slug.current,
      },
      conferences[]->{
        shortName,
        name,
        "slug": slug.current,
      },
      "slug": slug.current,
      "author": author->{name, "slug": slug.current},
    },
    "totalPosts": count(*[_type == "post" && sport->title match $sport])
  }
`);

export const querySportsAndDivisionNews = defineQuery(/* groq */ `
  {
    "posts": *[_type == "post" && sport->title match $sport && division->slug.current == $division] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      ...,
      division->{
        name,
        "slug": slug.current,
      },
      conferences[]->{
        shortName,
        name,
        "slug": slug.current,
      },
      "slug": slug.current,
      "author": author->{name, "slug": slug.current},
    },
    "totalPosts": count(*[_type == "post" && sport->title match $sport && division->slug.current == $division])
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
        "href": select(
          url.type == "internal" => url.internal->slug.current,
          url.type == "external" => url.external,
          url.href
        ),
      }
    },
    "logo": *[_type == "settings"][0].logo.asset->url + "?w=80&h=40&dpr=3&fit=max",
    "siteTitle": *[_type == "settings"][0].siteTitle,
    "socialLinks": *[_type == "settings"][0].socialLinks,
  }
`);