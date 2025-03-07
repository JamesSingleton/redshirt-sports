import { defineQuery } from "next-sanity";

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
  author->{
    _id,
    name,
    roles,
    ${imageFragment}
  },
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